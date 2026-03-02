/**
 * FE-Auto-Factory 代码生成渲染器 [Vant H5 适配器]
 * 主要负责 UI 层级 (View/Hook) 的拼装，通用逻辑交由 base.js 处理
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import * as base from './base.js'

export async function generatePage(params) {
  const { page_id, title, layout, api_endpoints, camel, kebab } = params
  const cwd = process.cwd()
  const config = base.getFactoryConfig(cwd)

  // 1. 生成渲染驱动特有的逻辑 (UI 层)
  await generateViewFile({ cwd, config, page_id, title, layout, camel, kebab })
  await generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab })

  // 2. 多端通用资产基建 (SUPERPOWERS)
  base.generateApiFile({ cwd, config, page_id, api_endpoints, kebab })
  base.generateStoreFile({ cwd, config, page_id, camel, kebab })
  base.generateTestFile({ cwd, config, page_id, title, api_endpoints, kebab, framework: 'vant' })

  // ── 新增: 原子组件与埋点同步 ──
  base.generateComponentScaffolds({ cwd, config, page_id, components: params.components || [] })
  base.syncTrackingAssets({ cwd, track: params.track || [] })

  // 3. AST 级路由安全注入
  await base.updateRouterSafely({ cwd, page_id, kebab })
}

/**
 * 渲染 Vant 风格的 View 模板
 */
async function generateViewFile({ cwd, config, page_id, title, layout, camel, kebab }) {
  const dir = join(cwd, config.viewsDir, page_id)
  mkdirSync(join(dir, 'components'), { recursive: true })
  mkdirSync(join(dir, 'hooks'), { recursive: true })

  const content = `<template>
  <div class="${kebab}-page" data-page-id="${page_id}">
    <van-nav-bar title="${title}" left-arrow @click-left="router.back()" />
    
    <div v-if="loading" class="flex justify-center py-10">
      <van-loading type="spinner" />
    </div>

    <van-empty v-else-if="error" image="error" :description="error">
       <van-button type="primary" size="small" @click="refresh">重试</van-button>
    </van-empty>

    <div v-else class="p-4">
      <!--【工厂生成】${title} 业务区域 -->
      ${layout === 'admin' ? '<div class="admin-h5-box">Admin 布局</div>' : '<!-- 业务 UI -->'}
      <van-empty description="请在此开始你的表演..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { use${page_id} } from './hooks/use${page_id}'

const router = useRouter()
const { loading, error, refresh } = use${page_id}()
</script>
`
  writeFileSync(join(dir, 'index.vue'), content, 'utf-8')
  console.log(`  ✔ View: ${config.viewsDir}/${page_id}/index.vue (Vant)`)
}

async function generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab }) {
  const dir = join(cwd, config.viewsDir, page_id, 'hooks')
  const apiImportPath = `@/${config.apiDir.replace('src/', '')}/${kebab}`
  const primaryApi = api_endpoints[0] || null

  const content = `/**
 * use${page_id} — Composable [Vant]
 */
import { ref, onMounted, reactive } from 'vue'
import { showToast } from 'vant'
${primaryApi ? `import { ${primaryApi} } from '${apiImportPath}'` : ''}

export function use${page_id}() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const state = reactive({ list: [] })

  const fetchData = async () => {
    loading.value = true
    try {
      ${primaryApi ? `const res = await ${primaryApi}({}) as any\n      state.list = res?.data ?? res` : '// NO-API'}
    } catch (e: any) {
      error.value = e.message
      showToast(e.message)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchData)
  return { loading, error, refresh: fetchData, state }
}
`
  writeFileSync(join(dir, `use${page_id}.ts`), content, 'utf-8')
  console.log(`  ✔ Hook: ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts`)
}
