import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { parseFrontmatter } from './utils/schema.js'

export async function cmdImgToCode(imagePath) {
    // 从当前工程读取架构标识 (Preset)
    let preset = 'vue3-vant-h5'
    const configPath = join(process.cwd(), '.factory', 'config.json')
    if (existsSync(configPath)) {
        try {
            const factoryConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
            if (factoryConfig.preset) preset = factoryConfig.preset
        } catch (e) {
            // ignore
        }
    }

    const isAdmin = preset === 'vue3-element-admin'

    const SYSTEM_PROMPT = `
你是一个资深前端架构师。当前工程栈: ${isAdmin ? '【PC管理系统 Vue3 + Element Plus】' : '【移动端H5 Vue3 + Vant 4】'}。
我会发给你一张产品原型截图或UI设计稿，请将其拆分成 YAML Schema。
禁止输出多余的 Markdown 引言，**只能输出纯 YAML 文本**。

---
page_id: PageName            # 根据页面含义生成，大驼峰结构 (如 ProductList)
title: 页面标题              # 提取出的中文页面主题
layout: ${isAdmin ? 'admin' : 'blank'}                # 采用 ${isAdmin ? 'admin' : 'blank'} 布局
route: /page-name            # kebab-case 前端路由
api_endpoints:               # 观察页面数据，推测1~3个API函数名 (如 getPageData)
  - yourApiName
components:                  # ${isAdmin ? '提列需导入的核心 Element Plus (如 ElTable, ElButton, ElForm)' : '提列需导入的核心 Vant 4 (如 VanButton, VanList)'}
  - ${isAdmin ? 'ElButton' : 'VanNavBar'}
state:                       # 分析页面核心响应式数据
  - pageData: object
  - tableList: array
track:                       # 埋点系统事件 ID
  - page-name-view
version: "1.0"
---
`
    if (!existsSync(imagePath)) {
        console.error(`❌ 图片不存在: ${imagePath}`)
        process.exit(1)
    }

    // 1. 获取图片 Base64
    const imageBuffer = readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const ext = imagePath.split('.').pop().toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

    console.log(`🤖 正在联络 AI 视觉大脑分析图片设计稿 [${imagePath}]...`)

    // 从环境变量抓取密钥 (这里为了演示做兼容，用户可以在命令行设定 VLM_API_KEY)
    const API_KEY = process.env.VLM_API_KEY || ''
    const API_URL = process.env.VLM_API_URL || 'https://api.openai.com/v1/chat/completions'
    const MODEL = process.env.VLM_MODEL || 'gpt-4o'

    if (!API_KEY) {
        console.error(`❌ 缺少大模型配置，请先在终端设置 export VLM_API_KEY="your-key"`)
        process.exit(1)
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: SYSTEM_PROMPT },
                            {
                                type: "image_url",
                                image_url: { url: `data:${mimeType};base64,${base64Image}` }
                            }
                        ]
                    }
                ],
                temperature: 0.1
            })
        })

        const data = await response.json()
        if (data.error) {
            throw new Error(data.error.message)
        }

        // 2. 拿到纯净的 YAML
        let yamlString = data.choices[0].message.content.trim()
        // 去除可能包围的 markdown 代码块 ```yaml ... ```
        yamlString = yamlString.replace(/^```yaml\n/, '').replace(/```$/, '').trim()

        const schema = parseFrontmatter(yamlString) // 使用通用稳定解析器
        const pageId = schema.page_id

        if (!pageId) {
            console.error("AI 产出的 YAML 中缺少 page_id 关键项，无法保存。")
            console.log("AI 输出内容:\n", yamlString)
            return
        }
        const schemaFile = join(process.cwd(), `schemas/pages/${pageId}.schema.yaml`)

        writeFileSync(schemaFile, yamlString, 'utf-8')
        console.log(`✨ AI 解析成功！已自动生成 Schema 图纸: ${schemaFile}`)

        // 4. 重中之重：联动底层的 generate，完成【解析图纸 -> 直接写出 Vue 代码】闭环！
        console.log(`🚀 开始根据该图纸自动生成下游业务代码...`)
        const { cmdGenerate } = await import('./factory.js')
        await cmdGenerate(['--schema', `schemas/pages/${pageId}.schema.yaml`])

    } catch (e) {
        console.error(`❌ 解析失败: ${e.message}`)
    }
}
