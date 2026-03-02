/**
 * FE-Auto-Factory 代码生成渲染器 [Element Plus Admin 适配器]
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
  base.generateTestFile({ cwd, config, page_id, title, api_endpoints, kebab, framework: 'element-plus' })

  base.generateComponentScaffolds({ cwd, config, page_id, components: params.components || [] })
  base.syncTrackingAssets({ cwd, track: params.track || [] })

  await base.updateRouterSafely({ cwd, page_id, kebab, meta: { title } })
}

/**
 * 渲染 Element Plus 风格的 View 模板 (支持增量合并)
 */
async function generateViewFile({ cwd, config, page_id, title, layout, camel, kebab, models, features }) {
  const dir = join(cwd, config.viewsDir, page_id)
  mkdirSync(join(dir, 'components'), { recursive: true })
  mkdirSync(join(dir, 'hooks'), { recursive: true })

  const filePath = join(dir, 'index.vue')
  let customUI = ''
  let customScript = ''

  if (existsSync(filePath)) {
    const existingContent = readFileSync(filePath, 'utf-8')
    customUI = base.extractSection(existingContent, '<!-- [FACTORY-CUSTOM-START] -->', '<!-- [FACTORY-CUSTOM-END] -->') || ''
    customScript = base.extractSection(existingContent, '// [FACTORY-SCRIPT-START]', '// [FACTORY-SCRIPT-END]') || ''
  }

  const hasModels = models && Object.keys(models).length > 0
  const firstModelName = hasModels ? Object.keys(models)[0] : null
  const fields = firstModelName ? Object.keys(models[firstModelName]) : ['id', 'name', 'status']

  const tableColumns = fields.map(f => `<el-table-column prop="${f}" label="${f.toUpperCase()}" />`).join('\n          ')

  const searchBar = features.search_bar ? `
       <div class="mb-4 flex gap-4">
          <el-input v-model="queryParams.keyword" placeholder="关键词搜索" style="width: 200px" />
          <el-button type="primary" @click="refresh">查询</el-button>
       </div>` : ''

  const pagination = features.pagination ? `
       <div class="mt-4 flex justify-end">
          <el-pagination 
            background 
            layout="total, prev, pager, next" 
            :total="state.total" 
            v-model:current-page="state.page"
            @current-change="refresh"
          />
       </div>` : ''

  const content = `<template>
  <div class="${kebab}-container" data-page-id="${page_id}" v-loading="loading">
    <el-page-header @back="router.back()" :content="'${title}'" class="mb-4" />
    
    <div v-if="error">
       <el-empty :description="error">
          <el-button type="primary" @click="refresh">点击重试</el-button>
       </el-empty>
    </div>

    <el-card v-else shadow="hover">
       <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">列表概览</h2>
          <el-button type="primary">新增数据</el-button>
       </div>

       ${searchBar}

       <el-table :data="state.list" style="width: 100%" border stripe>
          ${tableColumns}
          <el-table-column label="操作" width="180">
            <template #default="scope">
               <el-button link type="primary">预览</el-button>
               <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
       </el-table>

       ${pagination}

       <!-- [FACTORY-CUSTOM-START] -->
       ${customUI || '<!-- 可在此处插入自定义 UI 资产 -->'}
       <!-- [FACTORY-CUSTOM-END] -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { use${page_id} } from './hooks/use${page_id}'

const router = useRouter()
const queryParams = reactive({ keyword: '' })
const { loading, error, refresh, state } = use${page_id}()

// [FACTORY-SCRIPT-START]
${customScript || '// 自定义业务脚本区'}
// [FACTORY-SCRIPT-END]
</script>

<style scoped>
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.flex { display: flex; }
.gap-4 { gap: 1rem; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
</style>
`
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✔ View: ${config.viewsDir}/${page_id}/index.vue (Element Admin) [增量模式]`)
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
    stateProps.push(`    total: 0`)
    stateProps.push(`    page: 1`)
  }
  state.forEach(s => {
    const [name, type] = s.split(':').map(i => i.trim())
    stateProps.push(`    ${name}: undefined as ${type || 'any'}`)
  })

  const content = `/**
 * use${page_id} — Composable [Element Plus Admin]
 * [FACTORY-GENERATED] 支持 Features & State & 增量保护
 */
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
${typeImport}${primaryApi ? `import { ${primaryApi} } from '${apiImportPath}'` : ''}

export function use${page_id}() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const state = reactive({ 
${stateProps.join(',\n')}
  })

  // [FACTORY-HOOK-CUSTOM-START]
  ${customHookLogic || '// 自定义 Hook 业务逻辑'}
  // [FACTORY-HOOK-CUSTOM-END]

  const fetchData = async () => {
    loading.value = true
    try {
      ${primaryApi ? `const res = await ${primaryApi}({ page: state.page, size: 10 }) as any\n      state.list = res?.data ?? res\n      if(res?.total) state.total = res.total` : '// NO-API'}
    } catch (e: any) {
      error.value = e.message
      ElMessage.error(e.message)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchData)
  return { loading, error, refresh: fetchData, state }
}
`
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✔ Hook: ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts [增量模式]`)
}
