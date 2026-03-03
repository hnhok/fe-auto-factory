import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import ejs from 'ejs'
import * as base from './base.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatesDir = resolve(__dirname, '../../templates/vue3-vant')

export default {
  name: 'vue3-vant-h5',
  framework: 'vue3',
  ui: 'vant',
  templatesDir,

  /**
   * Vue 专属的 AST 手术层
   */
  patchHooks: {
    injectRouter: base.updateRouterSafely
  },

  /**
   * 微内核驱动引擎核心生命周期
   */
  async onGenerate(params) {
    const cwd = process.cwd()
    try {
      const { page_id } = params
      const config = params.config || base.getFactoryConfig(cwd)

      // 复用通用的模板引擎渲染 (现在通过 params 获取上文)
      await generateViewFile({ ...params, cwd, config, templatesDir })
      await generateHookFile({ ...params, cwd, config, templatesDir })

      // 多端通用资产基建调用 (直接调用 SDK 方法)
      base.generateTypesFile({ cwd, config, ...params })
      base.generateApiFile({ cwd, config, ...params })
      base.generateStoreFile({ cwd, config, ...params })
      base.generateMockFile({ cwd, ...params })
      base.generateTestFile({ cwd, config, framework: 'vant', ...params })

      base.generateComponentScaffolds({ cwd, config, components: params.components || [], ...params })
      base.syncTrackingAssets({ cwd, track: params.track || [] })

      // 触发本插件自己的特有注入逻辑
      await this.patchHooks.injectRouter({ cwd, page_id, kebab: params.kebab, meta: { title: params.title } })
    } catch (e) {
      console.error(e.stack)
      throw e
    }
  },

  async afterGenerate(params) {
    const cwd = process.cwd()
    console.log(`  ✨ [Plugin Hook] 正在尝试执行自动化代码格式化 (ESLint/Prettier)...`)
    try {
      execSync('npm run lint -- --fix', { cwd, stdio: 'ignore' })
      console.log(`  ✔ [Plugin Hook] 格式化完成！`)
    } catch (e) { }
  }
}


// UI layer generation delegated downwards...

/**
 * 渲染 Vant 风格的 View 模板 (支持增量合并)
 */
async function generateViewFile({ cwd, config, templatesDir, page_id, title, layout, camel, kebab, models = {}, features = {} }) {
  console.log('DEBUG PATHS:', { cwd, viewsDir: config?.viewsDir, page_id, templatesDir })
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

  // Replace messy string concatenation with clean EJS rendering
  const templatePath = join(templatesDir, 'view.vue.ejs')
  let content = ''
  if (existsSync(templatePath)) {
    content = ejs.render(readFileSync(templatePath, 'utf-8'), {
      page_id, title, layout, camel, kebab, models, features,
      customUI, customScript, itemContent
    })
  } else {
    throw new Error('EJS template not found at: ' + templatePath)
  }

  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✔ View: ${config.viewsDir}/${page_id}/index.vue (Vant H5) [增量模式, 基于 EJS]`)
}

async function generateHookFile({ cwd, config, templatesDir, page_id, title, api_endpoints = [], camel, kebab, models = {}, features = {}, state = [] }) {
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

  const templatePath = join(templatesDir, 'hook.ts.ejs')
  let content = ''
  if (existsSync(templatePath)) {
    content = ejs.render(readFileSync(templatePath, 'utf-8'), {
      page_id, title, api_endpoints, camel, kebab, models, features, state,
      customHookLogic, primaryApi, apiImportPath, typeImport, stateProps
    })
  } else {
    throw new Error('EJS template not found at: ' + templatePath)
  }
  if (existsSync(filePath)) {
    const isPatched = base.smartPatchHook(filePath, content, `use${page_id}`)
    if (isPatched) {
      console.log(`  ✔ Hook: ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts [AST 智能增量合并]`)
      return
    }
  }

  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✔ Hook: ${config.viewsDir}/${page_id}/hooks/use${page_id}.ts [新建覆盖]`)
}
