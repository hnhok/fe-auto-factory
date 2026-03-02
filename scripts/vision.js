import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

const SYSTEM_PROMPT = `
你是一个资深的移动端及中后台前端架构师。
我会给你发一张产品原型截图或UI设计稿，你需要将界面拆解，并输出符合我方框架规范的 YAML Schema 文件。
必须遵守以下输出格式（不要输出除 YAML 之外的任何多余推导和 markdown 代码块标识，**只输出纯 YAML 文本**）：

---
page_id: PageName            # 根据页面含义生成，大驼峰结构，如 ProductList
title: 页面标题              # 提取出的中文页面主题
layout: blank                # 可选: blank (普通H5), admin (后台), tabbar (带底部导航)
route: /page-name            # kebab-case 的前端路由
api_endpoints:               # 观察页面上有哪些数据，推测 1~3个 必备的 API 函数名，如 getProductList
  - yourApiName
components:                  # 观察设计稿，分析需要导入的 Vant 4 核心组件白名单。如 VanButton, VanList, VanCell, VanNavBar, VanImage
  - VanNavBar
state:                       # 分析页面需要用到的几个核心响应式数据 (名称: 类型)
  - pageData: object
track:                       # 埋点系统事件 ID
  - page-name-view
version: "1.0"
---
`

export async function cmdImgToCode(imagePath) {
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

        // 3. 提取名称并保存 Schema
        const pageIdMatch = yamlString.match(/page_id:\s*([a-zA-Z0-9_]+)/)
        if (!pageIdMatch) throw new Error("AI 未能规范产出 page_id")

        const pageId = pageIdMatch[1]
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
