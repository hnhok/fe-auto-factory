/**
 * FE-Auto-Factory 基础生成器核心
 * 包含所有框架通用的 CRUD、API、Store 等低级别代码生成逻辑
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { injectRoute, ensureNamedExport, ensureEnumMember, ensureImport } from './utils/ast.js'

/**
 * 通用配置读取 (支持多版本配置文件合并)
 */
export function getFactoryConfig(cwd) {
    const legacyPath = join(cwd, '.factory', 'config.json')
    const modernPath = join(cwd, '.factoryrc.json')

    let config = {
        viewsDir: 'src/views',
        apiDir: 'src/api',
        storeDir: 'src/store',
        testDir: 'tests/e2e',
        preset: 'vue3-vant-h5'
    }

    if (existsSync(legacyPath)) {
        try { config = { ...config, ...JSON.parse(readFileSync(legacyPath, 'utf-8')) } } catch (e) { }
    }
    if (existsSync(modernPath)) {
        try { config = { ...config, ...JSON.parse(readFileSync(modernPath, 'utf-8')) } } catch (e) { }
    }
    return config
}

/**
 * 生成 TS 类型定义文件 (Deep Type Safety)
 */
export function generateTypesFile({ cwd, config, page_id, kebab, models }) {
    if (!models || Object.keys(models).length === 0) return

    const dir = join(cwd, config.apiDir, 'types')
    mkdirSync(dir, { recursive: true })
    const filePath = join(dir, `${kebab}.ts`)

    let content = `/**
 * ${page_id} 自动生成的类型定义
 * [FACTORY-GENERATED] 基于 Schema Models
 */\n\n`

    for (const [name, fields] of Object.entries(models)) {
        content += `export interface I${name} {\n`
        for (const [fName, fType] of Object.entries(fields)) {
            const tsType = typeof fType === 'string' ? fType : 'any'
            content += `  ${fName}: ${tsType}\n`
        }
        content += `}\n\n`
    }

    writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✔ Types: ${config.apiDir}/types/${kebab}.ts`)
}

/**
 * 生成 Mock 数据镜像 (Parallel Development)
 */
export function generateMockFile({ cwd, page_id, kebab, models }) {
    if (!models || Object.keys(models).length === 0) return

    const dir = join(cwd, 'mock')
    mkdirSync(dir, { recursive: true })
    const filePath = join(dir, `${kebab}.mock.ts`)

    let mockData = {}
    for (const [name, fields] of Object.entries(models)) {
        const item = {}
        for (const [fName, fType] of Object.entries(fields)) {
            if (fType === 'string') item[fName] = `@ctitle(5)`
            else if (fType === 'number') item[fName] = `@integer(1, 100)`
            else if (fType === 'boolean') item[fName] = `@boolean`
            else item[fName] = null
        }
        mockData[name] = item
    }

    const content = `/**
 * ${page_id} Mock 镜像
 * [FACTORY-GENERATED]
 */
import { defineMock } from 'vite-plugin-mock'

export default defineMock([
  {
    url: '/api/${kebab}/list',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: Array(10).fill(null).map((_, i) => ({
          id: i + 1,
          ...${JSON.stringify(Object.values(mockData)[0] || {})}
        })),
        message: 'ok'
      }
    }
  }
])
`
    writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✔ Mock: mock/${kebab}.mock.ts`)
}

/**
 * 生成 API Service (支持 TS 类型注入 & AST 增量合并)
 */
export function generateApiFile({ cwd, config, page_id, api_endpoints, kebab, models }) {
    const dir = join(cwd, config.apiDir)
    mkdirSync(dir, { recursive: true })
    const filePath = join(dir, `${kebab}.ts`)

    const hasModels = models && Object.keys(models).length > 0
    const firstModel = hasModels ? `I${Object.keys(models)[0]}` : 'any'

    if (existsSync(filePath)) {
        // 增量模式
        log.info(`  ⚡ API 文件已存在，进入 AST 增量合并模式...`)

        if (hasModels) {
            ensureImport(filePath, `./types/${kebab}`, Object.keys(models).map(m => `I${m}`))
        }

        api_endpoints.forEach(name => {
            const isGet = /^(get|query|list|fetch|read|load)/i.test(name)
            const method = isGet ? 'get' : 'post'
            const endpoint = `/api/${kebab}/${camelToPath(name)}`
            const returnType = isGet && name.toLowerCase().includes('list') ? `Promise<{ data: ${firstModel}[] }>` : `Promise<any>`

            const content = `const ${name} = (${isGet ? 'params?: Record<string, any>' : 'data: Record<string, any>'}): ${returnType} => request.${method}(\`${endpoint}\`, { ${isGet ? 'params' : 'data'} })`

            const success = ensureNamedExport(filePath, { name, content })
            if (success) console.log(`    ✔ 增量注入 API: ${name}`)
        })
    } else {
        // 全量模式
        const functions = api_endpoints.map(name => {
            const isGet = /^(get|query|list|fetch|read|load)/i.test(name)
            const method = isGet ? 'get' : 'post'
            const endpoint = `/api/${kebab}/${camelToPath(name)}`
            return `
/** ${chineseName(name)} */
export const ${name} = (${isGet ? 'params?: Record<string, any>' : 'data: Record<string, any>'}) =>
  request.${method}(\`${endpoint}\`, { ${isGet ? 'params' : 'data'} })`
        }).join('\n')

        const typeImport = hasModels ? `import { ${Object.keys(models).map(m => `I${m}`).join(', ')} } from './types/${kebab}'\n` : ''

        const content = `/**
 * ${page_id} API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import request from '@/utils/request'
${typeImport}${functions || '\n// TODO: 添加 API 函数'}
`
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ API: ${config.apiDir}/${kebab}.ts (New)`)
    }
}

/**
 * 生成 Pinia Store (通用)
 */
export function generateStoreFile({ cwd, config, page_id, camel, kebab, models }) {
    const dir = join(cwd, config.storeDir)
    mkdirSync(dir, { recursive: true })

    const hasModels = models && Object.keys(models).length > 0
    const firstModel = hasModels ? `I${Object.keys(models)[0]}` : 'any'
    const typeImport = hasModels ? `import type { ${firstModel} } from '@/api/types/${kebab}'\n` : ''

    const content = `/**
 * ${page_id} Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成 (跨端通用版)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
${typeImport}
export const use${page_id}Store = defineStore('${kebab}', () => {
  const ${camel}List = ref<${firstModel}[]>([])
  const ${camel}Detail = ref<${firstModel} | null>(null)
  const total = ref(0)

  function set${page_id}List(list: ${firstModel}[]) { ${camel}List.value = list }
  function set${page_id}Detail(detail: ${firstModel}) { ${camel}Detail.value = detail }
  function reset() {
    ${camel}List.value = []
    ${camel}Detail.value = null
    total.value = 0
  }

  return { ${camel}List, ${camel}Detail, total, set${page_id}List, set${page_id}Detail, reset }
})
`
    const filePath = join(dir, `${kebab}.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ Store: ${config.storeDir}/${kebab}.ts`)
    }
}

/**
 * 生产 E2E 测试文件 (通用)
 */
export function generateTestFile({ cwd, config, page_id, title, api_endpoints, kebab, framework = 'vant' }) {
    const dir = join(cwd, config.testDir)
    mkdirSync(dir, { recursive: true })

    const content = `/**
 * ${page_id} E2E 测试 [工厂自动生成 - ${framework}]
 */
import { test, expect } from '@playwright/test'

test.describe('${page_id} — ${title}', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/${kebab}') })

  test('页面基础交互', async ({ page }) => {
    await expect(page.locator('[data-page-id="${page_id}"]')).toBeVisible()
    ${framework === 'vant'
            ? `await expect(page.locator('.van-nav-bar')).toBeVisible()`
            : `await expect(page.locator('.el-page-header')).toBeVisible()`}
  })
})
`
    const filePath = join(dir, `${kebab}.spec.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ Test: ${config.testDir}/${kebab}.spec.ts`)
    }
}

/**
 * 生成原子化业务组件脚手架
 * 智能区分 UI 库组件 (Van/El/Ant) 与自定义业务组件
 */
export function generateComponentScaffolds({ cwd, config, page_id, components }) {
    const viewDir = join(cwd, config.viewsDir, page_id, 'components')
    mkdirSync(viewDir, { recursive: true })

    const libPrefixes = ['Van', 'El', 'Ant', 'Base']

    components.forEach(name => {
        // 如果不是 UI 库的前缀，则视作需要生成的业务原子组件
        const isLib = libPrefixes.some(p => name.startsWith(p))
        if (!isLib) {
            const componentFile = join(viewDir, `${name}.vue`)
            if (!existsSync(componentFile)) {
                const content = `<template>
  <div class="c-${kebabCase(name)}">
    <!-- [FACTORY-SCAFFOLD] 原子组件: ${name} -->
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * ${name} 业务组件
 */
defineProps<{
  data?: any
}>()
</script>

<style scoped>
.c-${kebabCase(name)} { /* 样式在此开始 */ }
</style>
`
                writeFileSync(componentFile, content, 'utf-8')
                console.log(`    ✔ Component Scoped: ${page_id}/components/${name}.vue`)
            }
        }
    })
}

/**
 * 同步埋点资产 (Tracking Assets)
 * 自动维护全局埋点枚举，确保全端 ID 唯一且可追溯
 */
export function syncTrackingAssets({ cwd, track }) {
    if (!track || track.length === 0) return

    const trackFilePath = join(cwd, 'src/constants/tracking.ts')
    const dir = dirname(trackFilePath)
    mkdirSync(dir, { recursive: true })

    if (!existsSync(trackFilePath)) {
        writeFileSync(trackFilePath, `/**
 * 全局埋点事件 ID 定义池 [FACTORY]
 * 所有的埋点事件必须在此注册，严禁在业务端直接硬编码字符串 ID
 */
export enum TrackingEvents {
  APP_LAUNCH = 'app_launch'
}
`, 'utf-8')
    }

    // 使用 AST 注入新的枚举项
    track.forEach(id => {
        const key = id.toUpperCase().replace(/-/g, '_')
        const success = ensureEnumMember(trackFilePath, 'TrackingEvents', { name: key, value: id })
        if (success) console.log(`    ✔ 增量更新埋点枚举: ${key}`)
    })
    console.log(`  ✔ Tracking: 同步了 ${track.length} 个埋点资产至 constants/tracking.ts`)
}

/**
 * 执行 AST 安全路由注入
 */
export async function updateRouterSafely({ cwd, page_id, kebab, meta = {} }) {
    const routerPath = join(cwd, 'src', 'router', 'index.ts')
    if (!existsSync(routerPath)) return

    const success = injectRoute(routerPath, {
        path: `/${kebab}`,
        name: camelCase(page_id),
        componentPath: `@/views/${page_id}/index.vue`,
        meta
    })

    if (success) {
        console.log(`  ✔ Router: /${kebab} 已安全注入 (AST)`)
    } else {
        console.warn(`  ⚠ Router: 无法自动注入，请检查 src/router/index.ts 是否符合规范`)
    }
}

/**
 * 基础 Case 转换
 */
export function kebabCase(str) { return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') }
export function camelCase(str) { return str.charAt(0).toLowerCase() + str.slice(1) }

export function camelToPath(name) {
    return name.replace(/^(get|set|update|delete|create|list|query|fetch)/i, '')
        .replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

function chineseName(name) {
    const prefix = name.match(/^(get|set|update|delete|create|list|query|fetch)/i)?.[0]?.toLowerCase()
    const map = { get: '获取', set: '设置', update: '更新', delete: '删除', create: '创建', list: '列表', query: '查询', fetch: '拉取' }
    return (map[prefix] || '') + name.replace(/^(get|set|update|delete|create|list|query|fetch)/i, '')
}

const log = {
    info: (msg) => console.log(`\x1b[90m${msg}\x1b[0m`),
}
