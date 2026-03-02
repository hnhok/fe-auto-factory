/**
 * FE-Auto-Factory 代码生成渲染器 [Element Plus Admin 适配器]
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
  base.generateTestFile({ cwd, config, page_id, title, api_endpoints, kebab, framework: 'element-plus' })

  // ── 新增: 原子组件与埋点同步 ──
  base.generateComponentScaffolds({ cwd, config, page_id, components: params.components || [] })
  base.syncTrackingAssets({ cwd, track: params.track || [] })

  // 3. AST 级路由安全注入
  await base.updateRouterSafely({ cwd, page_id, kebab, meta: { title } })
}

/**
 * 渲染 Element Plus 风格的 View 模板 (表格模式)
 */
async function generateViewFile({ cwd, config, page_id, title, layout, camel, kebab }) {
  const dir = join(cwd, config.viewsDir, page_id)
  mkdirSync(join(dir, 'components'), { recursive: true })
  mkdirSync(join(dir, 'hooks'), { recursive: true })

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

       <el-table :data="state.list" style="width: 100%" border stripe>
          <el-table-column prop="id" label="ID" width="100" />
          <el-table-column prop="name" label="业务名称" />
          <el-table-column prop="status" label="状态" />
          <el-table-column label="操作" width="180">
            <template #default="scope">
               <el-button link type="primary">预览</el-button>
               <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
       </el-table>

       <div class="mt-4 flex justify-end">
          <el-pagination background layout="prev, pager, next" :total="100" />
       </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { use${page_id} } from './hooks/use${page_id}'

const router = useRouter()
const { loading, error, refresh, state } = use${page_id}()
</script>

<style scoped>
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
</style>
`
  writeFileSync(join(dir, 'index.vue'), content, 'utf-8')
  console.log(`  ✔ View: ${config.viewsDir}/${page_id}/index.vue (Element Admin)`)
}

async function generateHookFile({ cwd, config, page_id, title, api_endpoints, camel, kebab }) {
  const dir = join(cwd, config.viewsDir, page_id, 'hooks')
  const apiImportPath = `@/${config.apiDir.replace('src/', '')}/${kebab}`
  const primaryApi = api_endpoints[0] || null

  const content = `/**
 * use${page_id} — Composable [Element Plus Admin]
 * [FACTORY-GENERATED]
 */
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
${primaryApi ? `import { ${primaryApi} } from '${apiImportPath}'` : ''}

export function use${page_id}() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const state = reactive({ list: [] })

  const fetchData = async () => {
    loading.value = true
    try {
      ${primaryApi ? `const res = await ${primaryApi}({ page: 1, size: 10 }) as any\n      state.list = res?.data ?? res` : '// NO-API'}
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
  writeFileSync(join(dir, `use${page_id}.ts`), content, 'utf-8')
  console.log(`  ✔ Hook: ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts`)
}
