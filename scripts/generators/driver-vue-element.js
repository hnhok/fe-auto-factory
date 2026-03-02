/**
 * FE-Auto-Factory 代码生成器 (基于 Element Plus 适配器驱动)
 * 读取 Page Schema 生成完整的 PC 端中后台页面骨架代码
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = resolve(__dirname, '..', '..', 'templates') // 调整路径因为已经到了 generators 目录

/**
 * 主生成函数：根据 Schema 生成完整页面代码
 */
export async function generatePage({ page_id, title, layout, api_endpoints, components, camel, kebab }) {
    const cwd = process.cwd()

    // ─── 配置读取逻辑 ─────────────────────────────────────
    const configPath = join(cwd, '.factoryrc.json')
    const defaultConfig = {
        viewsDir: 'src/views',
        apiDir: 'src/api',
        storeDir: 'src/store',
        testDir: 'tests/e2e'
    }
    const config = existsSync(configPath)
        ? { ...defaultConfig, ...JSON.parse(readFileSync(configPath, 'utf-8')) }
        : defaultConfig

    // 生成各文件
    await generateViewFile({ cwd, config, page_id, title, layout, camel, components, kebab })
    await generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab })
    await generateApiFile({ cwd, config, page_id, api_endpoints, kebab })
    await generateStoreFile({ cwd, config, page_id, camel, kebab })
    await generateTestFile({ cwd, config, page_id, title, api_endpoints, camel, kebab })
    await updateRouter({ cwd, config, page_id, kebab })
}

// ─── View 页面文件 ─────────────────────────────────────────────────────────────
async function generateViewFile({ cwd, config, page_id, title, layout, camel, components, kebab }) {
    const dir = join(cwd, config.viewsDir, page_id)
    mkdirSync(join(dir, 'components'), { recursive: true })
    mkdirSync(join(dir, 'hooks'), { recursive: true })

    const content = `<template>
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: ${page_id} [驱动: vue3-element-admin] -->
  <div class="${kebabCase(page_id)}-container" data-page-id="${page_id}" v-loading="loading">
    
    <el-page-header @back="router.back()" :content="'${title}'" class="mb-4" />

    <!-- 全局错误状态 -->
    <el-empty
      v-if="error"
      image="error"
      :description="error"
    >
      <el-button type="primary" size="small" @click="refresh">重试加载</el-button>
    </el-empty>

    <!-- CONTENT START: 在此填写业务 UI ─────────────── -->
    <el-card v-else class="page-content" shadow="never">
${layout === 'admin' ? `      <div class="admin-layout-content">
        <!-- TODO: 渲染 ${camel}Data.list 为表格 -->
        <el-table :data="${camel}Data.list" style="width: 100%" border>
            <el-table-column prop="id" label="ID" width="180" />
            <el-table-column prop="name" label="名称" width="180" />
            <el-table-column prop="createdAt" label="创建时间" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" type="primary" link>编辑</el-button>
                <el-button size="small" type="danger" link>删除</el-button>
              </template>
            </el-table-column>
        </el-table>
        <div class="mt-4 flex justify-end">
          <el-pagination background layout="prev, pager, next" :total="${camel}Data.total || 0" />
        </div>
      </div>` : `      <!-- TODO: 渲染 ${camel}Data 数据 -->
      <el-empty description="开发中..." />`}
    </el-card>
    <!-- CONTENT END ──────────────────────────────── -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { use${page_id} } from './hooks/use${page_id}'

// [FACTORY-GENERATED] 自动注入的 Composable
const router = useRouter()
const {
  ${camel}Data,
  loading,
  error,
  refresh,
  // BUSINESS LOGIC: 在此解构更多业务方法
} = use${page_id}()
</script>

<style scoped lang="less">
.${kebabCase(page_id)}-container {
  padding: 20px;
  background-color: transparent;

  .mb-4 { margin-bottom: 16px; }
  .mt-4 { margin-top: 16px; }
  .flex { display: flex; }
  .justify-end { justify-content: flex-end; }
}
</style>
`

    writeFileSync(join(dir, 'index.vue'), content, 'utf-8')
    console.log(`  ✔ ${config.viewsDir}/${page_id}/index.vue (Element Plus 驱动)`)
}

// ─── Hook Composable ───────────────────────────────────────────────────────────
async function generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab }) {
    const dir = join(cwd, config.viewsDir, page_id, 'hooks')

    const apiDirPath = resolve(cwd, config.apiDir)
    const apiImportPath = `@/${config.apiDir.replace('src/', '')}/${kebab}`

    const primaryApi = api_endpoints[0] || null
    const importedApis = primaryApi ? [primaryApi] : []
    const commentedApis = api_endpoints.slice(1)

    const apiImports = importedApis.length > 0
        ? `import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ${primaryApi} } from '${apiImportPath}'
${commentedApis.length > 0 ? `// import { ${commentedApis.join(', ')} } from '${apiImportPath}' // 取消注释后可用` : ''}`.trim()
        : `// import { ... } from '${apiImportPath}'`

    const content = `/**
 * use${page_id} — ${title} 页面 Composable
 * [FACTORY-GENERATED] 基于 Schema 自动生成 (Element Plus 驱动)
 * ✏️  请在 // BUSINESS LOGIC 区块内填写核心业务逻辑
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
${apiImports}

export function use${page_id}() {
  // ─── 状态定义 ────────────────────────────────────────
  const loading = ref(false)
  const error = ref<string | null>(null)
  const ${camel}Data = reactive<Record<string, any>>({
    list: [],
    total: 0,
  })

  // ─── 数据获取 ────────────────────────────────────────
  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      // BUSINESS LOGIC: 根据实际接口调整请求参数，PC端常见带有 page/size
      ${primaryApi
            ? `const res = await ${primaryApi}({ page: 1, size: 10 }) as any\n      Object.assign(${camel}Data, res?.data ?? res)`
            : `// const res = await yourApi({}) as any\n      // Object.assign(${camel}Data, res?.data ?? res)`
        }
    } catch (e: any) {
      error.value = e?.message || '数据加载失败'
      ElMessage.error(error.value ?? '未知错误')
      console.error('[${page_id}] fetchData error:', e)
    } finally {
      loading.value = false
    }
  }

  // 页面挂载时自动拉取数据
  onMounted(fetchData)

  const refresh = () => fetchData()

  // BUSINESS LOGIC START ────────────────────────────────
  // TODO: 在此添加更多业务方法
  // BUSINESS LOGIC END ──────────────────────────────────

  return {
    ${camel}Data,
    loading,
    error,
    refresh,
  }
}
`

    writeFileSync(join(dir, `use${page_id}.ts`), content, 'utf-8')
    console.log(`  ✔ ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts`)
}

// ─── API Service 文件 ─────────────────────────────────────────────────────────
async function generateApiFile({ cwd, config, page_id, api_endpoints, kebab }) {
    const dir = join(cwd, config.apiDir)
    mkdirSync(dir, { recursive: true })

    const functions = api_endpoints.map(name => {
        const isGet = name.startsWith('get') || name.startsWith('query') || name.startsWith('list') || name.startsWith('fetch')
        const method = isGet ? 'get' : 'post'
        const endpoint = `/api/${kebab}/${camelToPath(name)}`
        return `
/** ${chineseName(name)} */
export const ${name} = (${isGet ? 'params?: Record<string, any>' : 'data: Record<string, any>'}) =>
  request.${method}(\`${endpoint}\`, { ${isGet ? 'params' : 'data'} })`
    }).join('\n')

    const content = `/**
 * ${page_id} API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成 (Element Plus)
 */
import request from '@/utils/request'
${functions || '\n// TODO: 添加 API 函数'}
`

    const filePath = join(dir, `${kebab}.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ ${config.apiDir}/${kebab}.ts`)
    }
}

// ─── Pinia Store ──────────────────────────────────────────────────────────────
async function generateStoreFile({ cwd, config, page_id, camel, kebab }) {
    const dir = join(cwd, config.storeDir)
    mkdirSync(dir, { recursive: true })

    const content = `/**
 * ${page_id} Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const use${page_id}Store = defineStore('${kebab}', () => {
  const ${camel}List = ref<any[]>([])
  const ${camel}Detail = ref<any | null>(null)
  const total = ref(0)

  function set${page_id}List(list: any[]) {
    ${camel}List.value = list
  }

  function set${page_id}Detail(detail: any) {
    ${camel}Detail.value = detail
  }

  function reset() {
    ${camel}List.value = []
    ${camel}Detail.value = null
    total.value = 0
  }

  return {
    ${camel}List,
    ${camel}Detail,
    total,
    set${page_id}List,
    set${page_id}Detail,
    reset,
  }
})
`

    const filePath = join(dir, `${kebab}.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ ${config.storeDir}/${kebab}.ts`)
    }
}

// ─── E2E 测试文件 ──────────────────────────────────────────────────────────────
async function generateTestFile({ cwd, config, page_id, title, api_endpoints, camel, kebab }) {
    const dir = join(cwd, config.testDir)
    mkdirSync(dir, { recursive: true })

    const content = `/**
 * ${page_id} E2E 测试
 * [FACTORY-GENERATED]
 */
import { test, expect } from '@playwright/test'

test.describe('${page_id} — ${title}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/${kebab}')
  })

  test('页面正常渲染表格', async ({ page }) => {
    await expect(page.locator('[data-page-id="${page_id}"]')).toBeVisible()
    await expect(page.locator('.el-table')).toBeVisible({ timeout: 5000 })
  })
})
`

    const filePath = join(dir, `${kebab}.spec.ts`)
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`  ✔ ${config.testDir}/${kebab}.spec.ts`)
    }
}

// ─── 更新路由 ────────────────────────────────────────────────────────────────
async function updateRouter({ cwd, page_id, kebab }) {
    const routerPath = join(cwd, 'src', 'router', 'index.ts')
    if (!existsSync(routerPath)) return

    let content = readFileSync(routerPath, 'utf-8')

    if (content.includes(`path: '/${kebab}'`)) return

    const routeEntry = `        {
            path: '/${kebab}',
            name: '${camelCase(page_id)}',
            component: () => import('@/views/${page_id}/index.vue'),
            meta: { title: '${page_id}' }
        }`

    const normalized = content.replace(/\r\n/g, '\n')
    const routesEnd = normalized.lastIndexOf('\n    ]')
    if (routesEnd !== -1) {
        const before = normalized.slice(0, routesEnd)
        const after = normalized.slice(routesEnd)
        const newContent = before + ',\n' + routeEntry + after
        writeFileSync(routerPath, newContent, 'utf-8')
        console.log(`  ✔ 路由 /${kebab} 已添加到 src/router/index.ts`)
    }
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
function kebabCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

function camelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1)
}

function camelToPath(name) {
    return name
        .replace(/^(get|set|update|delete|create|list|query|fetch)/i, '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
}

function chineseName(name) {
    const prefix = name.match(/^(get|set|update|delete|create|list|query|fetch)/i)?.[0]?.toLowerCase()
    const map = { get: '获取', set: '设置', update: '更新', delete: '删除', create: '创建', list: '列表', query: '查询', fetch: '拉取' }
    return (map[prefix] || '') + name.replace(/^(get|set|update|delete|create|list|query|fetch)/i, '')
}
