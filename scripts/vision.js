import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { parseFrontmatter } from './utils/schema.js'
import {
    hashImage,
    saveSnapshot,
    findByImageHash,
    listSnapshots,
    deleteSnapshot
} from './snapshot/store.js'
import { findSimilarSnapshots } from './snapshot/matcher.js'

// ─────────────────────────────────────────────
// 主命令：从图片识别 → 查快照 → 生成代码
// ─────────────────────────────────────────────
export async function cmdImgToCode(imagePath, { force = false, note = '' } = {}) {
    const cwd = process.cwd()

    // 从当前工程读取架构标识 (Preset)
    let preset = 'vue3-vant-h5'
    const configPath = join(cwd, '.factory', 'config.json')
    if (existsSync(configPath)) {
        try {
            const factoryConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
            if (factoryConfig.preset) preset = factoryConfig.preset
        } catch (e) { /* ignore */ }
    }

    if (!existsSync(imagePath)) {
        console.error(`❌ 图片不存在: ${imagePath}`)
        process.exit(1)
    }

    // ── Step 1: 精确匹配（同一张图片已识别过，直接复用）──────────────────────
    if (!force) {
        const exact = findByImageHash(imagePath, cwd)
        if (exact) {
            console.log(`\n⚡ 发现完全相同的图片快照！(${exact.page_id} · ${exact.created_at.split('T')[0]})`)
            console.log(`   跳过 AI 识别，直接复用历史 Schema：${exact.id}`)
            console.log(`   提示：如需强制重新识别，请携带 --force 参数\n`)
            await _generateFromYaml(exact.yaml_text, exact.schema, cwd)
            return
        }
    }

    // ── Step 2: AI 识别图片 → 获取 YAML ──────────────────────────────────────
    console.log(`🤖 正在联络 AI 视觉大脑分析图片设计稿 [${basename(imagePath)}]...`)
    const yamlText = await _callVisionModel(imagePath, preset)
    if (!yamlText) return

    const schema = parseFrontmatter(yamlText)
    if (!schema.page_id) {
        console.error('⚠️  AI 输出的 YAML 中缺少 page_id，请检查 AI 返回结果：')
        console.log(yamlText)
        return
    }

    // ── Step 3: 相似度匹配 → 询问开发者是否借用历史快照 ────────────────────
    if (!force) {
        const similar = findSimilarSnapshots(schema, cwd, 0.45)
        if (similar.length) {
            const best = similar[0]
            console.log(`\n🔍 发现 ${similar.length} 条相似历史快照！最高相似度：${(best.score * 100).toFixed(0)}%`)
            console.log(`   最接近的快照：${best.snapshot.title || best.snapshot.page_id} (${best.snapshot.id})`)
            console.log(`   相似理由：组件类型和接口结构高度重合`)
            console.log(`\n   ① 使用历史快照合并新信息生成（推荐）`)
            console.log(`   ② 完全使用本次 AI 全新识别结果`)
            console.log(`   ③ 取消`)

            // 在 IDE Agent 非交互模式下，默认使用本次 AI 识别结果
            // 在交互终端下，future: 可接入 Inquirer 让开发者选择
            console.log(`\n   [自动模式] 检测到 AI 识别与历史快照差异，本次将合并快照中的 components 与新识别内容...`)
            const merged = _mergeSchemas(best.snapshot.schema, schema)
            Object.assign(schema, merged)
        }
    }

    // ── Step 4: 持久化到快照库 ───────────────────────────────────────────────
    const { filepath } = saveSnapshot({ imagePath, yamlText, schema, cwd, note })
    console.log(`📦 已将本次识别结果存入快照库: ${filepath}`)

    // ── Step 5: 联动 generate，完成【解析图纸 → 写出 Vue/React 代码】闭环 ───
    await _generateFromYaml(yamlText, schema, cwd)
}

// ─────────────────────────────────────────────
// 快照管理命令
// ─────────────────────────────────────────────
export function cmdSnapshotList(cwd = process.cwd()) {
    const snaps = listSnapshots(cwd)
    if (!snaps.length) {
        console.log('📭 快照库为空。使用 npx fe-factory vision <image> 识别第一张设计稿后自动入库。')
        return
    }
    console.log(`\n📚 共有 ${snaps.length} 条视觉快照记录：\n`)
    snaps.forEach((s, i) => {
        console.log(`  ${i + 1}. [${s.page_id}] ${s.title || '(无标题)'}`)
        console.log(`     图片来源: ${s.image_source} · 录入时间: ${s.created_at.split('T')[0]}`)
        console.log(`     ID: ${s.id}\n`)
    })
}

export function cmdSnapshotDelete(id, cwd = process.cwd()) {
    const deleted = deleteSnapshot(id, cwd)
    if (deleted) {
        console.log(`✅ 快照 ${id} 已删除`)
    } else {
        console.log(`❌ 未找到快照 ${id}`)
    }
}

// ─────────────────────────────────────────────
// 内部工具
// ─────────────────────────────────────────────

/**
 * 调用视觉大模型，返回 YAML 文本（或 null）
 */
async function _callVisionModel(imagePath, preset) {
    const isAdmin = preset === 'vue3-element-admin'

    const SYSTEM_PROMPT = `
你是一个资深前端架构师。当前工程栈: ${isAdmin ? '【PC管理系统 Vue3 + Element Plus】' : '【移动端H5 Vue3 + Vant 4】'}。
我会发给你一张产品原型截图或UI设计稿，请将其拆分成 YAML Schema。
禁止输出多余的 Markdown 引言，**只能输出纯 YAML 文本**。

---
page_id: PageName            # 根据页面含义生成，大驼峰结构 (如 ProductList)
title: 页面标题              # 提取出的中文页面主题
layout: ${isAdmin ? 'admin' : 'blank'}
route: /page-name            # kebab-case 前端路由
features:
  pagination: false          # 若有列表翻页则为 true
  search_bar: false          # 若有搜索框则为 true
api_endpoints:               # 观察页面数据，推测1~3个API函数名
  - yourApiName
components:                  # ${isAdmin ? '提列需导入的核心 Element Plus 组件名' : '提列需导入的核心 Vant 4 组件名'}
  - ${isAdmin ? 'ElButton' : 'VanNavBar'}
state:
  pageData: object
models: {}
version: "1.0"
---
`

    const imageBuffer = readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const ext = imagePath.split('.').pop().toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

    const API_KEY = process.env.VLM_API_KEY || ''
    const API_URL = process.env.VLM_API_URL || 'https://api.openai.com/v1/chat/completions'
    const MODEL = process.env.VLM_MODEL || 'gpt-4o'

    if (!API_KEY) {
        console.error('❌ 缺少大模型配置，请先设置 VLM_API_KEY 环境变量')
        return null
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: MODEL,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: SYSTEM_PROMPT },
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                    ]
                }],
                temperature: 0.1
            })
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error.message)

        let yamlText = data.choices[0].message.content.trim()
        // 去除可能包围的 markdown 代码块
        yamlText = yamlText.replace(/^```yaml\n/, '').replace(/^```\n/, '').replace(/```$/, '').trim()
        return yamlText

    } catch (e) {
        console.error(`❌ AI 视觉识别失败: ${e.message}`)
        return null
    }
}

/**
 * 将快照历史 Schema 与新识别 Schema 合并（保留老的 components + API，叠加新识别的）
 */
function _mergeSchemas(oldSchema, newSchema) {
    const merged = { ...newSchema }

    // components 取并集
    const oldComps = oldSchema.components || []
    const newComps = newSchema.components || []
    merged.components = [...new Set([...oldComps, ...newComps])]

    // api_endpoints 取并集
    const oldApis = oldSchema.api_endpoints || []
    const newApis = newSchema.api_endpoints || []
    merged.api_endpoints = [...new Set([...oldApis, ...newApis])]

    return merged
}

/**
 * 持久化 YAML 并触发底层 generate
 */
async function _generateFromYaml(yamlText, schema, cwd) {
    const schemaFile = join(cwd, `schemas/pages/${schema.page_id}.schema.yaml`)
    writeFileSync(schemaFile, yamlText, 'utf-8')
    console.log(`✨ Schema 图纸已写入: ${schemaFile}`)

    console.log(`🚀 开始根据图纸自动生成业务代码...`)
    const { cmdGenerate } = await import('./factory.js')
    await cmdGenerate(['--schema', `schemas/pages/${schema.page_id}.schema.yaml`])
}
