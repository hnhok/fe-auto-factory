/**
 * FE-Auto-Factory 基础生成器核心
 * 包含所有框架通用的 CRUD、API、Store 等低级别代码生成逻辑
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { injectRoute } from './utils/ast.js'

/**
 * 通用配置读取
 */
export function getFactoryConfig(cwd) {
    const configPath = join(cwd, '.factoryrc.json')
    const defaultConfig = {
        viewsDir: 'src/views',
        apiDir: 'src/api',
        storeDir: 'src/store',
        testDir: 'tests/e2e'
    }
    return existsSync(configPath)
        ? { ...defaultConfig, ...JSON.parse(readFileSync(configPath, 'utf-8')) }
        : defaultConfig
}

/**
 * 生成 API Service (通用)
 */
export function generateApiFile({ cwd, config, page_id, api_endpoints, kebab }) {
    const dir = join(cwd, config.apiDir)
    mkdirSync(dir, { recursive: true })

    const functions = api_endpoints.map(name => {
        const isGet = /^(get|query|list|fetch|read|load)/i.test(name)
        const method = isGet ? 'get' : 'post'
        const endpoint = `/api/${kebab}/${camelToPath(name)}`
        return `
/** ${chineseName(name)} */
export const ${name} = (${isGet ? 'params?: Record<string, any>' : 'data: Record<string, any>'}) =>
  request.${method}(\`${endpoint}\`, { ${isGet ? 'params' : 'data'} })`
    }).join('\n')

    const content = `/**
 * ${page_id} API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ⚠️  若后端提供 Swagger，请使用 factory sync --swagger 重新生成规范类型
 */
import request from '@/utils/request'
${functions || '\n// TODO: 添加 API 函数'}
`
    const filePath = join(dir, `${kebab}.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ API: ${config.apiDir}/${kebab}.ts`)
    }
}

/**
 * 生成 Pinia Store (通用)
 */
export function generateStoreFile({ cwd, config, page_id, camel, kebab }) {
    const dir = join(cwd, config.storeDir)
    mkdirSync(dir, { recursive: true })

    const content = `/**
 * ${page_id} Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成 (跨端通用版)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const use${page_id}Store = defineStore('${kebab}', () => {
  const ${camel}List = ref<any[]>([])
  const ${camel}Detail = ref<any | null>(null)
  const total = ref(0)

  function set${page_id}List(list: any[]) { ${camel}List.value = list }
  function set${page_id}Detail(detail: any) { ${camel}Detail.value = detail }
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
