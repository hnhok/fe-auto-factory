/**
 * FE-Auto-Factory 驱动基石
 * 包含多端通用的文件生成逻辑、配置加载及代码注入原子操作
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { toKebabCase } from '../utils/string.js'
import { updateRouterSafely as _updateRouterSafely } from './utils/ast.js'
import { injectComponentTracking as _injectComponentTracking, syncTrackingAssets as _syncTrackingAssets } from './utils/ast.js'

export const updateRouterSafely = _updateRouterSafely
export const syncTrackingAssets = _syncTrackingAssets

/**
 * 加载工厂配置
 */
export function getFactoryConfig(cwd) {
    const configPath = join(cwd, '.factoryrc.json')
    const defaultConfig = {
        apiDir: 'src/api',
        storeDir: 'src/store',
        viewsDir: 'src/views',
        testDir: 'tests/e2e',
        trackFiles: ['src/constants/tracking.ts']
    }
    if (existsSync(configPath)) {
        try {
            return { ...defaultConfig, ...JSON.parse(readFileSync(configPath, 'utf-8')) }
        } catch (e) {
            return defaultConfig
        }
    }
    return defaultConfig
}

/**
 * 生成 TypeScript 类型定义文件
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
        if (typeof fields === 'string') continue // 忽略引用占位
        content += `export interface I${name} {\n`
        for (const [fName, fType] of Object.entries(fields)) {
            content += `  ${fName}: ${fType}\n`
        }
        content += `}\n\n`
    }

    writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✔ Types: ${config.apiDir}/types/${kebab}.ts`)
}

/**
 * 生成 Mock 数据文件
 */
export function generateMockFile({ cwd, page_id, kebab, models }) {
    if (!models || Object.keys(models).length === 0) return

    const dir = join(cwd, 'mock')
    mkdirSync(dir, { recursive: true })
    const filePath = join(dir, `${kebab}.mock.ts`)

    let mockData = {}
    for (const [name, fields] of Object.entries(models)) {
        if (typeof fields === 'string') continue
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
 * 生成 API 文件 (带类型支持)
 */
export function generateApiFile({ cwd, config, page_id, api_endpoints, kebab, models }) {
    const dir = join(cwd, config.apiDir)
    mkdirSync(dir, { recursive: true })
    const filePath = join(dir, `${kebab}.ts`)

    const hasModels = models && Object.keys(models).length > 0

    if (existsSync(filePath)) {
        console.log(`  ⚡ API 文件已存在，进入 AST 增量合并模式...`)
        // 增量模式通常由驱动或 factory.js 处理 AST 注入，此处做基本保障
        return
    } else {
        const functions = api_endpoints.map(name => {
            const isList = name.toLowerCase().includes('list')
            const returnType = isList && hasModels ? `Promise<I${Object.keys(models)[0]}[]>` : `Promise<any>`
            return `
export function ${name}(params?: any): ${returnType} {
  return request({
    url: '/api/${kebab}/${toKebabCase(name)}',
    method: 'get',
    params
  })
}`
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
 * 生成 Pinia Store
 * [v2.7.0] 支持 features (pagination) 和 state 字段
 */
export function generateStoreFile({ cwd, config, page_id, camel, kebab, models, features = {}, state = [] }) {
    const dir = join(cwd, config.storeDir)
    mkdirSync(dir, { recursive: true })

    const hasModels = models && Object.keys(models).length > 0
    const firstModel = hasModels ? `I${Object.keys(models)[0]}` : 'any'
    const typeImport = hasModels ? `import type { ${firstModel} } from '@/api/types/${kebab}'\n` : ''

    let stateFields = []
    if (features.pagination) {
        stateFields.push(`  const total = ref(0)`)
        stateFields.push(`  const page = ref(1)`)
    }

    // 自定义状态字段解析 (fieldName: type)
    state.forEach(s => {
        const [name, type] = s.split(':').map(i => i.trim())
        stateFields.push(`  const ${name} = ref<${type || 'any'}>()`)
    })

    const content = `/**
 * ${page_id} Pinia Store
 * [FACTORY-GENERATED] 支持 Features & State
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
${typeImport}
export const use${page_id}Store = defineStore('${kebab}', () => {
  const ${camel}List = ref<${firstModel}[]>([])
  const ${camel}Detail = ref<${firstModel} | null>(null)
${stateFields.join('\n')}

  function set${page_id}List(list: ${firstModel}[]) { ${camel}List.value = list }
  function reset() {
    ${camel}List.value = []
    ${camel}Detail.value = null
    ${features.pagination ? 'total.value = 0; page.value = 1;' : ''}
  }

  return { 
    ${camel}List, ${camel}Detail, 
    ${features.pagination ? 'total, page,' : ''}
    ${state.map(s => s.split(':')[0].trim()).join(', ')}
    set${page_id}List, reset 
  }
})
`
    const filePath = join(dir, `${kebab}.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ Store: ${config.storeDir}/${kebab}.ts`)
    }
}

/**
 * 生产 E2E 测试文件
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
 */
export function generateComponentScaffolds({ cwd, config, page_id, components }) {
    const viewDir = join(cwd, config.viewsDir, page_id, 'components')
    mkdirSync(viewDir, { recursive: true })

    const libPrefixes = ['Van', 'El', 'Ant', 'Base']

    components.forEach(name => {
        const isLib = libPrefixes.some(p => name.startsWith(p))
        if (!isLib) {
            const componentFile = join(viewDir, `${name}.vue`)
            if (!existsSync(componentFile)) {
                const content = `<template>
  <div class="c-${toKebabCase(name)}">
    <!-- [FACTORY-SCAFFOLD] 原子组件: ${name} -->
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * ${name} - 由 FE-Auto-Factory 自动生成的原子业务组件
 */
</script>

<style scoped>
</style>
`
                writeFileSync(componentFile, content, 'utf-8')
                console.log(`    ✔ Component Scoped: ${page_id}/components/${name}.vue`)
            }
        }
    })
}
