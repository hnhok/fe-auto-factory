/**
 * FE-Auto-Factory Schema 校验器 (v2 - 重构版)
 * 变更:
 *   - [P0] 改用与 generate.js 相同的 parseFrontmatter (js-yaml) 解析器，消除静默 bug
 *   - [P1] 组件白名单从外部 schemas/component-whitelist.json 加载，支持多预设
 *   - [P1] 支持在 .factory/config.json 中声明自定义扩展组件列表
 */
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { parseFrontmatter } from './utils/schema.js'

// ─── 加载组件白名单（外部 JSON + 用户自定义追加）────────────────────────────
function loadComponentWhitelist(cwd = process.cwd()) {
    const builtInPath = resolve(cwd, 'schemas', 'component-whitelist.json')
    const factoryConfigPath = join(cwd, '.factory', 'config.json')

    let whitelist = new Set()

    // 1. 加载内置白名单
    if (existsSync(builtInPath)) {
        try {
            const data = JSON.parse(readFileSync(builtInPath, 'utf-8'))
            // 合并所有框架的组件
            Object.values(data).flat().forEach(c => whitelist.add(c))
        } catch (e) {
            console.warn('[validator] 无法加载组件白名单文件，将跳过组件合规检查')
        }
    }

    // 2. 加载用户在 .factory/config.json 中自定义追加的组件
    if (existsSync(factoryConfigPath)) {
        try {
            const config = JSON.parse(readFileSync(factoryConfigPath, 'utf-8'))
            const customComps = config.customComponents || []
            customComps.forEach(c => whitelist.add(c))
        } catch (e) { /* ignore */ }
    }

    return whitelist
}

// ─── 根据 preset 获取对应的组件前缀，以便做更精准的警告提示 ─────────────────
function getPresetComponentPrefix(preset = 'vue3-vant-h5') {
    if (preset.includes('element')) return 'El'
    if (preset.includes('antd') || preset.includes('react')) return 'Ant'
    return 'Van'
}

// 合法的布局类型（与 page.schema.json 保持同步）
const VALID_LAYOUTS = ['blank', 'dashboard', 'tabbar', 'fullscreen', 'admin']

/**
 * 校验单个 Schema 文件
 */
function validateSchema(filePath, whitelist, factoryConfig = {}) {
    const errors = []
    const warnings = []

    const content = readFileSync(filePath, 'utf-8')
    // [P0] 使用工业级 js-yaml 解析器，而非手工解析
    const schema = parseFrontmatter(content)

    if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
        errors.push(`[${filePath}] 缺少有效的 YAML Frontmatter (--- ... ---)，或内容为空`)
        return { errors, warnings, passed: false }
    }

    // ─── 必填字段校验 ───────────────────────────────────
    if (!schema.page_id) {
        errors.push('缺少必填字段: page_id')
    } else if (!/^[A-Z][a-zA-Z0-9]+$/.test(schema.page_id)) {
        errors.push(`page_id 必须为 PascalCase 格式，当前值: "${schema.page_id}"`)
    }

    if (!schema.title) {
        warnings.push('建议填写 title（页面标题）')
    }

    // ─── 路由校验 ───────────────────────────────────────
    if (schema.route && !schema.route.startsWith('/')) {
        errors.push(`route 必须以 "/" 开头，当前值: "${schema.route}"`)
    }

    // ─── 布局类型校验 ───────────────────────────────────
    if (schema.layout && !VALID_LAYOUTS.includes(schema.layout)) {
        errors.push(`layout 值无效: "${schema.layout}"，合法值: ${VALID_LAYOUTS.join(' | ')}`)
    }

    // ─── 组件合规校验（使用外部白名单，支持多预设） ──────
    if (Array.isArray(schema.components) && whitelist.size > 0) {
        const prefix = getPresetComponentPrefix(factoryConfig.preset)
        for (const comp of schema.components) {
            if (!whitelist.has(comp)) {
                warnings.push(`组件 "${comp}" 不在组件白名单中 (预设: ${factoryConfig.preset || 'vue3-vant-h5'})，请确认是否需要在 .factory/config.json 的 customComponents 中注册`)
            }
        }
    }

    // ─── 埋点事件校验 ───────────────────────────────────
    if (Array.isArray(schema.track)) {
        for (const trackId of schema.track) {
            if (!/^[a-z][a-z0-9-]*$/.test(trackId)) {
                errors.push(`埋点 ID "${trackId}" 格式不规范，应为 kebab-case（如 buy-now-click）`)
            }
        }
    }

    // ─── API 端点命名校验 ────────────────────────────────
    if (Array.isArray(schema.api_endpoints)) {
        for (const api of schema.api_endpoints) {
            if (!/^[a-z][a-zA-Z0-9]+$/.test(api)) {
                errors.push(`API 端点 "${api}" 格式不规范，应为 camelCase（如 getOrderDetail）`)
            }
        }
    }

    // ─── models 结构校验（简单检测是否为对象而非空字符串）──
    if (schema.models !== undefined && typeof schema.models !== 'object') {
        errors.push('models 字段必须是一个对象（如 models: { OrderItem: { id: number } }）')
    }

    return {
        errors: errors.map(e => `  ❌ [${schema.page_id || '?'}] ${e}`),
        warnings: warnings.map(w => `  ⚠️  [${schema.page_id || '?'}] ${w}`),
        passed: errors.length === 0,
    }
}

/**
 * 校验所有 Schema 文件
 */
export async function validateAll() {
    const cwd = process.cwd()
    const schemasDir = resolve(cwd, 'schemas', 'pages')

    if (!existsSync(schemasDir)) {
        return { passed: true, count: 0, errors: [], warnings: [] }
    }

    const files = readdirSync(schemasDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))

    if (files.length === 0) {
        return { passed: true, count: 0, errors: [], warnings: [] }
    }

    // 一次性加载白名单和工厂配置（避免对每个文件重复 I/O）
    const whitelist = loadComponentWhitelist(cwd)
    let factoryConfig = {}
    const configPath = join(cwd, '.factory', 'config.json')
    if (existsSync(configPath)) {
        try { factoryConfig = JSON.parse(readFileSync(configPath, 'utf-8')) } catch (e) { }
    }

    const allErrors = []
    const allWarnings = []

    for (const file of files) {
        const result = validateSchema(join(schemasDir, file), whitelist, factoryConfig)
        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)
        if (result.warnings.length > 0) {
            result.warnings.forEach(w => console.log(w))
        }
    }

    return {
        passed: allErrors.length === 0,
        count: files.length,
        errors: allErrors,
        warnings: allWarnings,
    }
}
