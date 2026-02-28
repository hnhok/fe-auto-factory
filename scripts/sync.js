import { writeFileSync, existsSync, mkdirSync } from 'fs'
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
    } catch (err) {
        console.error('❌ 同步 Swagger 失败:', err.message)
    }
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        // 简单支持如果用户传本地 mock 的情况，这里主要做网络请求
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
