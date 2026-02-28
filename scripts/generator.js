/**
 * FE-Auto-Factory 代码生成器
 * 读取 Page Schema 生成完整的页面骨架代码
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = resolve(__dirname, '..', 'templates')

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
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: ${page_id} -->
  <!-- ✏️  请在 <!-- CONTENT --> 区域内填写业务 UI -->
  <div class="${kebabCase(page_id)}-page" data-page-id="${page_id}">
    <!-- 导航栏 -->
    <van-nav-bar
      title="${title}"
      left-arrow
      @click-left="router.back()"
    />

    <!-- 全局 Loading 状态 -->
    <div v-if="loading" class="page-loading">
      <van-loading type="spinner" size="36" />
    </div>

    <!-- 全局错误状态 -->
    <van-empty
      v-else-if="error"
      image="error"
      :description="error"
    >
      <van-button type="primary" size="small" @click="refresh">重试</van-button>
    </van-empty>

    <!-- CONTENT START: 在此填写业务 UI ─────────────── -->
    <div v-else class="page-content">
${layout === 'dashboard' ? `      <div class="dashboard-layout">
        <aside class="sidebar">左侧边栏 (Dashboard)</aside>
        <main class="main-area">
          <h3>${title} 仪表盘</h3>
          <!-- TODO: 渲染 ${camel}Data 数据 -->
        </main>
      </div>` : layout === 'admin' ? `      <div class="admin-layout">
        <header class="admin-header">顶部导航栏 (Admin)</header>
        <div class="admin-body">
          <aside class="admin-sidebar">左侧管理菜单</aside>
          <main class="admin-main">
            <!-- TODO: 渲染 ${camel}Data 数据 -->
            <van-empty description="开发中..." />
          </main>
        </div>
      </div>` : `      <!-- TODO: 渲染 ${camel}Data 数据 -->
      <!-- 例如:
      <DataTable :data="${camel}Data.list" />
      -->
      <van-empty description="开发中..." />`}
    </div>
    <!-- CONTENT END ──────────────────────────────── -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { use${page_id} } from './hooks/use${page_id}'

// [FACTORY-GENERATED] 自动注入的 Composable
const router = useRouter()
const {
  // ${camel}Data,  // ← 取消注释后可在 CONTENT 区域中使用
  loading,
  error,
  refresh,
  // BUSINESS LOGIC: 在此解构更多业务方法
} = use${page_id}()
</script>

<style scoped lang="less">
.${kebabCase(page_id)}-page {
  min-height: 100vh;
  background: #f7f8fa;

  .page-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 120px 0;
  }

  .page-content {
    padding: 12px 16px;
  }
}

/* 布局专属样式 */
.dashboard-layout {
  display: flex;
  gap: 16px;
  .sidebar { width: 200px; background: white; padding: 16px; border-radius: 8px; }
  .main-area { flex: 1; background: white; padding: 16px; border-radius: 8px; }
}

.admin-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 46px);
  .admin-header { height: 60px; background: #fff; border-bottom: 1px solid #ebedf0; padding: 0 20px; display: flex; align-items: center; }
  .admin-body { display: flex; flex: 1; overflow: hidden; }
  .admin-sidebar { width: 240px; background: #fff; border-right: 1px solid #ebedf0; }
  .admin-main { flex: 1; padding: 20px; overflow-y: auto; }
}
</style>
`

  writeFileSync(join(dir, 'index.vue'), content, 'utf-8')
  console.log(`  ✔ ${config.viewsDir}/${page_id}/index.vue`)
}

// ─── Hook Composable ───────────────────────────────────────────────────────────
async function generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab }) {
  const dir = join(cwd, config.viewsDir, page_id, 'hooks')

  // 动态计算 API 导入路径，根据 apiDir 和 viewsDir 的相对位置
  const apiDirPath = resolve(cwd, config.apiDir)
  const viewsDirPath = resolve(cwd, config.viewsDir, page_id, 'hooks')
  let relativeApi = join(resolve(apiDirPath, kebab)).replace(/\\/g, '/')
  // 简化处理：通常在 src 下，我们可以用 @/api/
  const apiImportPath = `@/${config.apiDir.replace('src/', '')}/${kebab}`

  // 将第一个 API 作为主请求，其余的作为注释可用
  const primaryApi = api_endpoints[0] || null
  const importedApis = primaryApi ? [primaryApi] : []
  const commentedApis = api_endpoints.slice(1)

  // 生成 API 导入语句（只主动导入第一个，其余注释）
  const apiImports = importedApis.length > 0
    ? `import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
import { ${primaryApi} } from '${apiImportPath}'
${commentedApis.length > 0 ? `// import { ${commentedApis.join(', ')} } from '${apiImportPath}' // 取消注释后可用` : ''}`.trim()
    : `// import { ... } from '${apiImportPath}'`

  const content = `/**
 * use${page_id} — ${title} 页面 Composable
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ✏️  请在 // BUSINESS LOGIC 区块内填写核心业务逻辑
 */
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
${apiImports}

export function use${page_id}() {
  // ─── 状态定义 ────────────────────────────────────────
  const loading = ref(false)
  const error = ref<string | null>(null)
  const ${camel}Data = reactive<Record<string, any>>({
    // TODO: 根据 API 响应结构补充类型
    list: [],
    total: 0,
  })

  // ─── 数据获取 ────────────────────────────────────────
  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      // BUSINESS LOGIC: 根据实际接口调整请求参数
      ${primaryApi
      ? `const res = await ${primaryApi}({}) as any\n      Object.assign(${camel}Data, res?.data ?? res)`
      : `// const res = await yourApi({}) as any\n      // Object.assign(${camel}Data, res?.data ?? res)`
    }
    } catch (e: any) {
      error.value = e?.message || '数据加载失败'
      showToast({ type: 'fail', message: error.value ?? '未知错误' })
      console.error('[${page_id}] fetchData error:', e)
    } finally {
      loading.value = false
    }
  }

  // 页面挂载时自动拉取数据
  onMounted(fetchData)

  // ─── 业务方法 ────────────────────────────────────────
  const refresh = () => fetchData()

  // BUSINESS LOGIC START ────────────────────────────────
  // TODO: 在此添加更多业务方法
  // 例如：const handleSubmit = async (form) => { ... }
  // BUSINESS LOGIC END ──────────────────────────────────

  return {
    ${camel}Data,
    loading,
    error,
    refresh,
    // BUSINESS LOGIC: 在此暴露更多业务方法
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

  // 生成每个端点的函数
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
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ⚠️  若后端提供 Swagger，请使用 factory sync --swagger 重新生成规范类型
 */
import request from '@/utils/request'
${functions || '\n// TODO: 添加 API 函数'}
`

  const filePath = join(dir, `${kebab}.ts`)
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✔ ${config.apiDir}/${kebab}.ts`)
  } else {
    console.log(`  ⚠ ${config.apiDir}/${kebab}.ts 已存在，跳过（避免覆盖）`)
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
  // ─── State ───────────────────────────────────────────
  const ${camel}List = ref<any[]>([])
  const ${camel}Detail = ref<any | null>(null)
  const total = ref(0)

  // ─── Actions ─────────────────────────────────────────
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

  // BUSINESS LOGIC: 在此添加更多 actions
  
  return {
    ${camel}List,
    ${camel}Detail,
    total,
    set${page_id}List,
    set${page_id}Detail,
    reset,
  }
}, {
  persist: false, // 调整是否需要持久化
})
`

  const filePath = join(dir, `${kebab}.ts`)
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✔ ${config.storeDir}/${kebab}.ts`)
  } else {
    console.log(`  ⚠ ${config.storeDir}/${kebab}.ts 已存在，跳过`)
  }
}

// ─── E2E 测试文件 ──────────────────────────────────────────────────────────────
async function generateTestFile({ cwd, config, page_id, title, api_endpoints, camel, kebab }) {
  const dir = join(cwd, config.testDir)
  mkdirSync(dir, { recursive: true })

  const content = `/**
 * ${page_id} E2E 测试
 * [FACTORY-GENERATED] 基于 Schema User Story 自动生成
 * ✏️  请根据实际业务补充测试步骤
 */
import { test, expect } from '@playwright/test'

test.describe('${page_id} — ${title}', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 按需添加登录或前置操作
    await page.goto('/${kebab}')
  })

  test('页面正常渲染', async ({ page }) => {
    // 验证页面骨架存在
    await expect(page.locator('[data-page-id="${page_id}"]')).toBeVisible()
    // 等待 loading 消失
    await expect(page.locator('.van-loading')).not.toBeVisible({ timeout: 5000 })
  })

  test('错误状态正确显示', async ({ page }) => {
    // 拦截 API 请求，模拟错误
    ${api_endpoints[0] ? `await page.route('**/${kebab}/**', route => route.abort())` : '// TODO: 拦截 API 请求'}
    await page.goto('/${kebab}')
    await expect(page.locator('.van-empty')).toBeVisible({ timeout: 5000 })
  })

  // BUSINESS LOGIC START ─────────────────────────────
  // TODO: 根据 PRD User Story 补充业务测试
  // test('用户可以执行 X 操作', async ({ page }) => {
  //   await page.click('[data-track-id="xxx"]')
  //   await expect(page.locator('.van-toast')).toContainText('操作成功')
  // })
  // BUSINESS LOGIC END ───────────────────────────────
})
`

  const filePath = join(dir, `${kebab}.spec.ts`)
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✔ ${config.testDir}/${kebab}.spec.ts`)
  } else {
    console.log(`  ⚠ ${config.testDir}/${kebab}.spec.ts 已存在，跳过`)
  }
}

// ─── 更新路由 ────────────────────────────────────────────────────────────────
async function updateRouter({ cwd, page_id, kebab }) {
  const routerPath = join(cwd, 'src', 'router', 'index.ts')
  if (!existsSync(routerPath)) return

  let content = readFileSync(routerPath, 'utf-8')

  // 避免重复添加
  if (content.includes(`path: '/${kebab}'`)) {
    console.log(`  ⚠ 路由 /${kebab} 已存在，跳过`)
    return
  }

  const routeEntry = `        {
            path: '/${kebab}',
            name: '${camelCase(page_id)}',
            component: () => import('@/views/${page_id}/index.vue')
        }`

  // 策略：在 routes: [ ... ] 闭合的 ] 之前插入，保持逗号分隔
  // 支持 CRLF 和 LF
  const normalized = content.replace(/\r\n/g, '\n')
  // 找到最后一个路由项结束符 } 后追加（在 ] 前插入）
  const routesEnd = normalized.lastIndexOf('\n    ]')
  if (routesEnd !== -1) {
    const before = normalized.slice(0, routesEnd)
    const after = normalized.slice(routesEnd)
    const newContent = before + ',\n' + routeEntry + after
    writeFileSync(routerPath, newContent, 'utf-8')
    console.log(`  ✔ 路由 /${kebab} 已添加到 src/router/index.ts`)
  } else {
    console.log(`  ⚠ 无法自动注入路由，请手动添加: path '/${kebab}'`)
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
  // getOrderDetail → order-detail
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
