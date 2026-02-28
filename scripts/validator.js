/**
 * FE-Auto-Factory Schema 校验器
 * 验证 Page Schema YAML 文件的合规性
 */
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// 合法的 Vant 组件白名单（部分）
const VANT_COMPONENTS = [
    'VanNavBar', 'VanButton', 'VanField', 'VanForm', 'VanCell', 'VanCellGroup',
    'VanList', 'VanPullRefresh', 'VanTab', 'VanTabs', 'VanTag', 'VanBadge',
    'VanSwipe', 'VanSwipeItem', 'VanImage', 'VanIcon', 'VanDivider',
    'VanPopup', 'VanDialog', 'VanActionSheet', 'VanDropdownMenu', 'VanDropdownItem',
    'VanPicker', 'VanDatePicker', 'VanTimePicker', 'VanCalendar',
    'VanCheckbox', 'VanRadio', 'VanSwitch', 'VanStepper', 'VanSlider',
    'VanUploader', 'VanSearch', 'VanSkeleton', 'VanLoading', 'VanEmpty',
    'VanToast', 'VanNotify', 'VanGrid', 'VanGridItem', 'VanSteps',
    // 业务自定义组件（统一规范：前缀自定义）
    'DataTable', 'StatusBadge', 'ActionBar', 'FilterPanel', 'DetailCard',
    'PageHeader', 'EmptyState', 'ErrorState',
]

// 合法的布局类型
const VALID_LAYOUTS = ['blank', 'dashboard', 'tabbar', 'fullscreen']

/**
 * 解析 YAML Frontmatter（简化解析，不依赖外部库）
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return null

    const yaml = match[1]
    const result = {}

    let currentKey = null
    let inArray = false

    for (const line of yaml.split('\n')) {
        // 数组项
        if (line.match(/^\s+-\s+/)) {
            const value = line.replace(/^\s+-\s+/, '').trim()
            if (currentKey && Array.isArray(result[currentKey])) {
                result[currentKey].push(value)
            }
            continue
        }

        const colonIdx = line.indexOf(':')
        if (colonIdx === -1) continue

        const key = line.slice(0, colonIdx).trim()
        const raw = line.slice(colonIdx + 1).trim()
        currentKey = key

        if (raw === '' || raw === '[]') {
            result[key] = raw === '[]' ? [] : []
        } else if (raw.startsWith('[')) {
            // 行内数组
            result[key] = raw.slice(1, -1)
                .split(',')
                .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
                .filter(Boolean)
        } else {
            result[key] = raw.replace(/^['"]|['"]$/g, '')
        }
    }

    return result
}

/**
 * 校验单个 Schema 文件
 */
function validateSchema(filePath) {
    const errors = []
    const warnings = []

    const content = readFileSync(filePath, 'utf-8')
    const schema = parseFrontmatter(content)

    if (!schema) {
        errors.push(`[${filePath}] 缺少 YAML Frontmatter (--- ... ---)`)
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

    // ─── 组件合规校验 ───────────────────────────────────
    if (Array.isArray(schema.components)) {
        for (const comp of schema.components) {
            if (!VANT_COMPONENTS.includes(comp)) {
                warnings.push(`组件 "${comp}" 不在组件白名单中，请确认是否需要新增自定义组件`)
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
    const schemasDir = resolve(process.cwd(), 'schemas', 'pages')

    if (!existsSync(schemasDir)) {
        return { passed: true, count: 0, errors: [], warnings: [] }
    }

    const files = readdirSync(schemasDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))

    if (files.length === 0) {
        return { passed: true, count: 0, errors: [], warnings: [] }
    }

    const allErrors = []
    const allWarnings = []

    for (const file of files) {
        const result = validateSchema(join(schemasDir, file))
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
