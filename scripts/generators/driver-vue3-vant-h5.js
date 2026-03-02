/**
 * FE-Auto-Factory 代码生成渲染器 [Vant H5 适配器]
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import * as base from './base.js'

export async function generatePage(params) {
  const { page_id, title, layout, api_endpoints, camel, kebab, models = {}, features = {}, state = [] } = params
  const cwd = process.cwd()
  const config = base.getFactoryConfig(cwd)

  // 1. 生成渲染驱动特有的逻辑 (UI 层)
  await generateViewFile({ cwd, config, page_id, title, layout, camel, kebab, models, features })
  await generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab, models, features, state })

  // 2. 多端通用资产基建
  base.generateTypesFile({ cwd, config, page_id, kebab, models })
  base.generateApiFile({ cwd, config, page_id, api_endpoints, kebab, models })
  base.generateStoreFile({ cwd, config, page_id, camel, kebab, models, features, state })
  base.generateMockFile({ cwd, page_id, kebab, models })
  base.generateTestFile({ cwd, config, page_id, title, api_endpoints, kebab, framework: 'vant' })

  base.generateComponentScaffolds({ cwd, config, page_id, components: params.components || [] })
  base.syncTrackingAssets({ cwd, track: params.track || [] })

  await base.updateRouterSafely({ cwd, page_id, kebab, meta: { title } })
}

/**
 * 渲染 Vant 风格的 View 模板 (支持增量合并)
 */
async function generateViewFile({ cwd, config, page_id, title, layout, camel, kebab, models, features }) {
  const dir = join(cwd, config.viewsDir, page_id)
  mkdirSync(join(dir, 'components'), { recursive: true })
  mkdirSync(join(dir, 'hooks'), { recursive: true })

  const filePath = join(dir, 'index.vue')
  let existingContent = ''
  let customUI = ''
  let customScript = ''

  if (existsSync(filePath)) {
    existingContent = readFileSync(filePath, 'utf-8')
    customUI = base.extractSection(existingContent, '<!-- [FACTORY-CUSTOM-START] -->', '<!-- [FACTORY-CUSTOM-END] -->') || ''
    customScript = base.extractSection(existingContent, '// [FACTORY-SCRIPT-START]', '// [FACTORY-SCRIPT-END]') || ''
  }

  const hasModels = models && Object.keys(models).length > 0
  const firstModelName = hasModels ? Object.keys(models)[0] : null
  const fields = firstModelName ? Object.keys(models[firstModelName]) : ['id', 'title', 'desc']

  const itemContent = fields.map(f => `<p>${f.toUpperCase()}: {{ item.${f} }}</p>`).join('\n            ')

  let innerContent = `
      <div v-for="item in state.list" :key="item.id" class="list-item">
          ${itemContent}
      </div>`

  if (features.pagination) {
    innerContent = `
      <van-list
        v-model:loading="loading"
        :finished="state.finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        ${innerContent}
      </van-list>`
  }

  if (features.pull_to_refresh) {
    innerContent = `
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      ${innerContent}
    </van-pull-refresh>`
  }

  const content = `<template>
  <div class="${kebab}-page" data-page-id="${page_id}">
    <van-nav-bar :title="'${title}'" left-arrow @click-left="router.back()" />
    
    <div class="content">
      ${innerContent}

      <!-- [FACTORY-CUSTOM-START] -->
      ${customUI || '<!-- 这里可以编写您的自定义业务 UI (保留区) -->'}
      <!-- [FACTORY-CUSTOM-END] -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { use${page_id} } from './hooks/use${page_id}'

const router = useRouter()
const refreshing = ref(false)
const { loading, error, state, refresh, loadMore } = use${page_id}()

// [FACTORY-SCRIPT-START]
${customScript || '// 在此处编写您的自定义业务逻辑 (保留区)'}
// [FACTORY-SCRIPT-END]

const onRefresh = async () => {
  await refresh()
  refreshing.value = false
}

const onLoad = () => {
  loadMore()
}
</script>

<style scoped>
.content { padding: 16px; }
.list-item { 
  background: #fff; 
  padding: 12px; 
  margin-bottom: 12px; 
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
</style>
`
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✔ View: ${config.viewsDir}/${page_id}/index.vue (Vant H5) [增量模式]`)
}

async function generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab, models, features, state = [] }) {
  const dir = join(cwd, config.viewsDir, page_id, 'hooks')
  const filePath = join(dir, `use${page_id}.ts`)

  let customHookLogic = ''
  if (existsSync(filePath)) {
    const existingContent = readFileSync(filePath, 'utf-8')
    customHookLogic = base.extractSection(existingContent, '// [FACTORY-HOOK-CUSTOM-START]', '// [FACTORY-HOOK-CUSTOM-END]') || ''
  }

  const apiImportPath = `@/${config.apiDir.replace('src/', '')}/${kebab}`
  const primaryApi = api_endpoints[0] || null

  const hasModels = models && Object.keys(models).length > 0
  const firstModel = hasModels ? `I${Object.keys(models)[0]}` : 'any'
  const typeImport = hasModels ? `import type { ${firstModel} } from '@/api/types/${kebab}'\n` : ''

  let stateProps = [`    list: [] as ${firstModel}[]`]
  if (features.pagination) {
    stateProps.push(`    page: 1`)
    stateProps.push(`    finished: false`)
  }
  state.forEach(s => {
    const [name, type] = s.split(':').map(i => i.trim())
    stateProps.push(`    ${name}: undefined as ${type || 'any'}`)
  })

  const content = `/**
 * use${page_id} — Composable [Vant H5]
 * [FACTORY-GENERATED] 支持 Features & State & 增量保护
 */
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
${typeImport}${primaryApi ? `import { ${primaryApi} } from '${apiImportPath}'` : ''}

export function use${page_id}() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const state = reactive({ 
${stateProps.join(',\n')}
  })

  // [FACTORY-HOOK-CUSTOM-START]
  ${customHookLogic || '// 在此处编写您的自定义 Hook 逻辑 (保留区)\n  const myCustomFunc = () => {}'}
  // [FACTORY-HOOK-CUSTOM-END]

  const refresh = async () => {
    state.page = 1
    state.finished = false
    state.list = []
    await fetchData()
  }

  const loadMore = async () => {
    if (state.finished) return
    state.page++
    await fetchData()
  }

  const fetchData = async () => {
    loading.value = true
    try {
      ${primaryApi ? `const res = await ${primaryApi}({ page: state.page }) as any\n      const newList = res?.data ?? res\n      state.list = [...state.list, ...newList]\n      if (newList.length < 10) state.finished = true` : '// NO-API\n      state.finished = true'}
    } catch (e: any) {
      error.value = e.message
      showToast(e.message)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    if (!${features.pagination ? 'true' : 'false'}) fetchData()
  })

  return { loading, error, state, refresh, loadMore }
}
`
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✔ Hook: ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts [增量模式]`)
}
