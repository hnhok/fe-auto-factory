import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { toKebabCase, toCamelCase } from '../utils/string.js'
import { parseFrontmatter } from '../utils/schema.js'
import { log, printBanner } from '../utils/logger.js'

export async function cmdGenerate(args, loadGlobalModels, __dirname) {
    printBanner()
    const schemaFlag = args.indexOf('--schema')
    const schemaFile = schemaFlag !== -1 ? args[schemaFlag + 1] : null

    if (!schemaFile) {
        log.error('请提供 Schema 文件。用法: factory generate --schema <path>')
        process.exit(1)
    }

    if (!existsSync(schemaFile)) {
        log.error(`Schema 文件不存在: ${schemaFile}`)
        process.exit(1)
    }

    log.step(`读取 Schema: ${schemaFile}`)

    // 简单 YAML 解析（提取 frontmatter）
    const content = readFileSync(schemaFile, 'utf-8')
    const schema = parseFrontmatter(content)

    // 引入 Ajv 强校验
    log.info(`使用 Ajv 校验 Schema 规范...`)
    try {
        const Ajv = (await import('ajv')).default
        const ajv = new Ajv({ strict: false })
        const schemaDefPath = resolve(__dirname, '../../schemas/page.schema.json')
        if (existsSync(schemaDefPath)) {
            const schemaDef = JSON.parse(readFileSync(schemaDefPath, 'utf-8'))
            const validate = ajv.compile(schemaDef)
            const valid = validate(schema)
            console.log('DEBUG SCHEMA:', schema)
            if (!valid) {
                log.error('Schema 规范不符，请修复以下错误:')
                console.log(JSON.stringify(validate.errors, null, 2))
                process.exit(1)
            } else {
                log.success('Schema 校验通过')
            }
        }
    } catch (e) {
        log.warn(`Ajv 校验环节报错或未安装，已跳过强校验: ${e.message}`)
    }

    const {
        page_id, title = page_id, layout = 'blank',
        api_endpoints = [], components = [], track = [],
        models = {}, features = {}, state = []
    } = schema
    const camel = toCamelCase(page_id)
    const kebab = toKebabCase(page_id)

    log.info(`生成页面: ${page_id} (${title})`)
    log.gray(`布局: ${layout} | API: ${api_endpoints.join(', ') || '无'} | 模型: ${Object.keys(models).length} 个 | 特性: ${Object.keys(features).join(',') || '无'}`)

    const projectRoot = process.cwd()
    const globalModels = loadGlobalModels(projectRoot)

    // 1. 加载 Preset (优先从旧版目录加载，保持兼容)
    const legacyConfigPath = join(projectRoot, '.factory', 'config.json')
    const modernConfigPath = join(projectRoot, '.factoryrc.json')

    let factoryConfig = { preset: 'vue3-vant-h5' }
    if (existsSync(legacyConfigPath)) { try { factoryConfig = { ...factoryConfig, ...JSON.parse(readFileSync(legacyConfigPath, 'utf-8')) } } catch (e) { } }
    if (existsSync(modernConfigPath)) { try { factoryConfig = { ...factoryConfig, ...JSON.parse(readFileSync(modernConfigPath, 'utf-8')) } } catch (e) { } }

    const preset = factoryConfig.preset
    log.info(`工厂接管：预设 [${preset}] | 项目根目录: ${projectRoot}`)
    if (Object.keys(globalModels).length > 0) log.gray(`加载全局模型池: 发现 ${Object.keys(globalModels).length} 个共享模型`)

    // ─── 模型池构建与 $ref 核心转换 (工业级) ───
    const pool = { ...globalModels, ...models }
    const pageModels = { ...models }

    const resolveRefs = (target) => {
        Object.keys(target).forEach(mName => {
            const fields = target[mName]
            if (typeof fields !== 'object') return
            Object.keys(fields).forEach(fName => {
                const val = fields[fName]
                if (typeof val === 'string' && val.startsWith('$ref:')) {
                    const refTarget = val.split(':')[1].trim()
                    target[mName][fName] = pool[refTarget] ? `I${refTarget}` : 'any'
                }
            })
        })
    }

    resolveRefs(pageModels)
    resolveRefs(globalModels)

    // ─── 驱动沙箱加载 (优先级: 本地项目 > 工厂内置) ──────────────────────
    let generator = null
    const localDriverPath = join(projectRoot, '.factory', 'drivers', `driver-${preset}.js`)
    const builtInDriverPath = join(__dirname, 'generators', `driver-${preset}.js`)

    try {
        const pluginNamespace = `@fe-factory/plugin-${preset}`

        if (existsSync(localDriverPath)) {
            log.info(`⚡ [驱动加载] 命中项目本地自定义驱动 (Local Sandbox): ${localDriverPath}`)
            generator = await import(new URL('file:///' + localDriverPath.replace(/\\/g, '/')))
        } else {
            // v3.2.0: 开放的 npm 插件生态体系
            try {
                generator = await import(pluginNamespace)
                log.info(`🧩 [驱动加载] 命中外部独立 npm 插件 (Micro-kernel): ${pluginNamespace}`)
            } catch (npmErr) {
                if (existsSync(builtInDriverPath)) {
                    log.info(`📦 [驱动加载] 命中官方内置驱动 (Legacy Default)`)
                    generator = await import(new URL(`../generators/driver-${preset}.js`, import.meta.url).href)
                } else {
                    log.warn(`找不到预设 [${preset}] 的渲染驱动，回滚至基础 H5 驱动...`)
                    generator = await import(new URL(`../generators/driver-vue-vant.js`, import.meta.url).href)
                }
            }
        }

        // ─── 执行生成 ───────────────────────────────────────────
        const generateParams = {
            page_id, title, layout, api_endpoints, components, track, features, state,
            models: pageModels, globalModels, camel, kebab
        }

        if (generator.default?.onGenerate) {
            log.step(`🚀 [Micro-kernel] 将接力棒转交驱动生命周期 hook: ${generator.default.name || preset}...`)
            if (typeof generator.default.beforeGenerate === 'function') {
                log.info(`[Plugin Hook] 执行驱动前置钩子 (beforeGenerate)...`)
                await generator.default.beforeGenerate(generateParams)
            }
            await generator.default.onGenerate(generateParams)
            if (typeof generator.default.afterGenerate === 'function') {
                log.info(`[Plugin Hook] 执行后置钩子 (afterGenerate)...`)
                await generator.default.afterGenerate(generateParams)
            }
        } else if (generator.generatePage) {
            if (typeof generator.beforeGenerate === 'function') {
                log.info(`[Hook] 执行驱动前置钩子 (beforeGenerate)...`)
                await generator.beforeGenerate(generateParams)
            }
            await generator.generatePage(generateParams)
            if (typeof generator.afterGenerate === 'function') {
                log.info(`[Hook] 执行驱动后置钩子 (afterGenerate)...`)
                await generator.afterGenerate(generateParams)
            }
        } else {
            throw new Error(`驱动程序不支持生成规范，缺少 onGenerate 亦或旧版 generatePage 导出！`)
        }
    } catch (err) {
        log.error(`渲染驱动加载或执行失败，预设 [${preset}] 可能尚不支持或代码有误。`)
        console.error(err)
        process.exit(1)
    }

    log.success(`代码生成完成！`)
    log.gray(`生成文件:`)
    log.gray(`  src/views/${page_id}/index.vue`)
    log.gray(`  src/views/${page_id}/hooks/use${page_id}.ts`)
    log.gray(`    src/api/${kebab}.ts
    src/api/types/${kebab}.ts
    src/store/${kebab}.ts
    mock/${kebab}.mock.ts
    tests/e2e/${kebab}.spec.ts`)
}
