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

        // [v3.4.0] Swagger -> Schema 批量逆向工程（不再只取一个实体）
        generateSchemaFromSwagger(schemas, cwd)
    } catch (err) {
        console.error('❌ 同步 Swagger 失败:', err.message)
        process.exit(1)
    }
}

/**
 * 批量逆向推导：为每一个真实业务实体生成独立的 Page Schema 图纸
 * v3.4.0 重构：批量处理所有非泛型业务类型（旧版只取第一个 Entity）
 */
function generateSchemaFromSwagger(schemas, cwd) {
    const keys = Object.keys(schemas)
    if (keys.length === 0) return

    const schemaDir = join(cwd, 'schemas', 'pages')
    if (!existsSync(schemaDir)) mkdirSync(schemaDir, { recursive: true })

    // 过滤掉泛型包装类型（不生成 Schema 的包装器）
    const GENERIC_WRAPPERS = /^(BaseResponse|PageInfo|Result|ApiResult|CommonResult|Resp|Response|Page|IPage|Wrapper)/i
    const businessEntities = keys.filter(k => !GENERIC_WRAPPERS.test(k))

    if (businessEntities.length === 0) {
        console.log('  ⚠️  未发现符合规范的业务实体（均为泛型包装类），跳过 Schema 生成')
        return
    }

    let generatedCount = 0
    const generatedFiles = []

    for (const entityKey of businessEntities) {
        const schemaObj = schemas[entityKey]

        // 剔除泛型符号，如 User«List» → User
        let cleanKey = entityKey.replace(/[«»<>]/g, '').replace(/[^a-zA-Z0-9]/g, '')
        cleanKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)

        const kebab = cleanKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        const schemaPath = join(schemaDir, `${cleanKey}.schema.yaml`)

        // 若文件已存在，不覆盖（防止误伤开发者已编辑的图纸）
        if (existsSync(schemaPath)) {
            console.log(`  ⏭️  已存在，跳过: schemas/pages/${cleanKey}.schema.yaml`)
            continue
        }

        // 从 Swagger 属性推导 models 字段（过滤列表包装字段）
        let modelFieldLines = ''
        const propNames = Object.keys(schemaObj.properties || {})
        for (const pName of propNames) {
            if (/^(list|items|records|data|content|rows)$/i.test(pName)) continue
            const type = mapType(schemaObj.properties[pName]).replace('[]', '')
            modelFieldLines += `    ${pName}: "${type}"\n`
        }

        // 推断常用的 CRUD api_endpoints
        const apiEndpoints = [`get${cleanKey}List`, `get${cleanKey}Detail`]
        if (/status|state/i.test(propNames.join(','))) {
            apiEndpoints.push(`update${cleanKey}Status`)
        }

        const yamlContent = [
            '---',
            `page_id: "${cleanKey}"`,
            `title: "【Swagger 反向生成】${cleanKey}"`,
            'layout: "blank"',
            `route: "/${kebab}"`,
            'api_endpoints:',
            ...apiEndpoints.map(a => `  - "${a}"`),
            'components:',
            '  - "VanList"',
            '  - "VanCell"',
            '  - "VanEmpty"',
            'features:',
            '  pagination: true',
            '  search_bar: false',
            'state:',
            '  keyword: string',
            'models:',
            `  ${cleanKey}:`,
            modelFieldLines || '    id: "number"',
            'track:',
            `  - "${kebab}-view"`,
            'version: "1.0"',
            '---',
            ''
        ].join('\n')

        writeFileSync(schemaPath, yamlContent, 'utf-8')
        generatedFiles.push(`schemas/pages/${cleanKey}.schema.yaml`)
        generatedCount++
    }

    console.log(`\n🎉 [Swagger 反向工程] 共生成 ${generatedCount} / ${businessEntities.length} 个实体的 Schema:`)
    generatedFiles.forEach(f => console.log(`  📎 ${f}`))
    if (generatedCount < businessEntities.length) {
        console.log(`  ⏭️  已存在的 schema 不会被覆盖，如需重新生成请手动删除对应文件。`)
    }
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

        const client = url.startsWith('https') ? https : http
        client.get(url, (res) => {
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body))
                } catch (e) {
                    reject(new Error('JSON 解析失败，请确认接口返回的是合法 JSON'))
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
