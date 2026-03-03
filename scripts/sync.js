import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import http from 'http'
import https from 'https'

export async function syncSwagger(url) {
    console.log(`\n⏳ 正在拉取 Swagger 文档: ${url}`)

    try {
        const data = await fetchJson(url)
        console.log('✔ 成功获取 Swagger 定义文件')

        // 解析 definitions (Swagger 2) 或 components.schemas (OpenAPI 3)
        const schemas = data.components?.schemas || data.definitions || {}
        let tsContent = `/**\n * [FACTORY-GENERATED] 基于 Swagger 自动生成的 TS 类型定义\n * 来源: ${url}\n * ⚠️ 请勿手动修改\n */\n\n`

        let count = 0
        for (const [key, schema] of Object.entries(schemas)) {
            tsContent += parseSchemaToTs(key, schema) + '\n\n'
            count++
        }

        const cwd = process.cwd()
        const apiDir = join(cwd, 'src', 'api')
        if (!existsSync(apiDir)) mkdirSync(apiDir, { recursive: true })

        const outputPath = join(apiDir, 'types.ts')
        writeFileSync(outputPath, tsContent, 'utf-8')

        console.log(`✅ 成功生成 TypeScript 类型！共计 ${count} 个定义。`)
        console.log(`  输出文件: src/api/types.ts`)

        // [v3.1.0] Swagger -> Schema 逆向工程
        generateSchemaFromSwagger(schemas, cwd)
    } catch (err) {
        console.error('❌ 同步 Swagger 失败:', err.message)
    }
}

/**
 * 智能逆向推导: 抽取核心业务模型，反向生成 Page Schema 图纸
 */
function generateSchemaFromSwagger(schemas, cwd) {
    const keys = Object.keys(schemas)
    if (keys.length === 0) return

    // 智能选取一个具备代表性的实体 (包含了 User/Product/Order/Item 等，或首个实体)
    const targetKey = keys.find(k => /user|product|order|item|record/i.test(k)) || keys[0]

    // 剔除泛型符号，如 BaseResponse«User» -> User
    let cleanKey = targetKey.replace(/[^a-zA-Z0-9]/g, '')
    // 兜底大驼峰
    cleanKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)

    const kebab = cleanKey.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

    const schemaObj = schemas[targetKey]
    let modelFields = ''
    if (schemaObj.properties) {
        for (const [pName, pDef] of Object.entries(schemaObj.properties)) {
            // 将 Swagger 的类型简化为前端类型 (剔除数组修饰，保留基本推断)
            const type = mapType(pDef).replace('[]', '')
            modelFields += `    ${pName}: "${type}"\n`
        }
    }

    const yamlContent = `---
page_id: "${cleanKey}Auto"
title: "[机器生成] ${cleanKey} 页面"
layout: "blank"
route: "/${kebab}-auto"
api_endpoints:
  - "get${cleanKey}List"
  - "query${cleanKey}Detail"
components:
  - "VanButton"
  - "VanCellGroup"
  - "VanCell"
  - "VanList"
state:
  - "keyword: string"
track:
  - "${kebab}-view"
models:
  ${cleanKey}:
${modelFields || '    id: "number"'}
version: "1.0"
---
`

    const schemaDir = join(cwd, 'schemas', 'pages')
    if (!existsSync(schemaDir)) mkdirSync(schemaDir, { recursive: true })

    const schemaPath = join(schemaDir, `${cleanKey}Auto.schema.yaml`)
    writeFileSync(schemaPath, yamlContent, 'utf-8')
    console.log(`\n🎉 [Smart Reverse] API 驱动 -> 逆向页面推导完成！`)
    console.log(`  工厂基于 "${targetKey}" 实体智能分析了结构，并为您生成了高可用图纸:`)
    console.log(`  📎 schemas/pages/${cleanKey}Auto.schema.yaml`)
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        if (!url.startsWith('http')) {
            try {
                const content = readFileSync(url, 'utf-8')
                resolve(JSON.parse(content))
            } catch (e) {
                reject(new Error('本地文件读取或解析失败: ' + e.message))
            }
            return
        }

        // 网络请求
        const client = url.startsWith('https') ? https : http
        client.get(url, (res) => {
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body))
                } catch (e) {
                    reject(new Error('JSON 解析失败'))
                }
            })
        }).on('error', reject)
    })
}

function parseSchemaToTs(name, schema) {
    let ts = `export interface ${name} {\n`
    const props = schema.properties || {}
    const required = schema.required || []

    for (const [propName, propDef] of Object.entries(props)) {
        const isRequired = required.includes(propName) ? '' : '?'
        const type = mapType(propDef)
        const comment = propDef.description ? `  /** ${propDef.description} */\n` : ''
        ts += `${comment}  ${propName}${isRequired}: ${type};\n`
    }

    ts += `}`
    return ts
}

function mapType(propDef) {
    if (propDef.$ref) {
        const parts = propDef.$ref.split('/')
        return parts[parts.length - 1]
    }
    switch (propDef.type) {
        case 'integer':
        case 'number':
            return 'number'
        case 'boolean':
            return 'boolean'
        case 'array':
            return propDef.items ? `${mapType(propDef.items)}[]` : 'any[]'
        case 'string':
            return 'string'
        default:
            return 'any'
    }
}
