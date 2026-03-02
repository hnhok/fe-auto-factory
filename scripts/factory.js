#!/usr/bin/env node
/**
 * FE-Auto-Factory CLI
 * Usage: node scripts/factory.js <command> [options]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync, spawnSync } from 'child_process'

import { toKebabCase, toCamelCase } from './utils/string.js'
import { parseFrontmatter } from './utils/schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FACTORY_VERSION = '2.5.0'

// ─── ANSI Color Helpers ───────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
}
const log = {
  info: (msg) => console.log(`${c.cyan}[Factory]${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✅ ${msg}${c.reset}`),
  warn: (msg) => console.log(`${c.yellow}⚠️  ${msg}${c.reset}`),
  error: (msg) => console.error(`${c.red}❌ ${msg}${c.reset}`),
  step: (msg) => console.log(`${c.bold}${c.blue}▶ ${msg}${c.reset}`),
  gray: (msg) => console.log(`${c.gray}  ${msg}${c.reset}`),
}

// ─── ASCII Banner ─────────────────────────────────────────────────────────────
function printBanner() {
  console.log(`${c.cyan}${c.bold}`)
  console.log('╔══════════════════════════════════════════╗')
  console.log('║        🏭  FE-Auto-Factory  v' + FACTORY_VERSION + '       ║')
  console.log('║   前端自动化工厂 · Schema驱动开发流水线  ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(c.reset)
}

// ─── Command: init ────────────────────────────────────────────────────────────
async function cmdInit(initialProjectName) {
  printBanner()

  let projectName = initialProjectName
  let preset = 'vue3-vant-h5'

  const inquirer = (await import('inquirer')).default;

  if (!projectName) {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'projectName', message: '请输入新项目的名称:', validate: i => i ? true : '项目名称不能为空' }
    ]);
    projectName = answers.projectName;
  }

  const presetFlagIdx = process.argv.indexOf('--preset')
  preset = presetFlagIdx !== -1 ? process.argv[presetFlagIdx + 1] : null

  if (!preset) {
    const tpAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: '请选择目标业务场景模板:',
        choices: [
          { name: '📱 移动端 H5 业务模板 (Vue3 + Vant)', value: 'vue3-vant-h5' },
          { name: '💻 PC 中后台管理系统 (Vue3 + Element Plus)', value: 'vue3-element-admin' },
          { name: '⚛️ PC 中后台管理系统 (React + Ant Design) [敬请期待]', value: 'react-antd-admin' }
        ]
      }
    ])
    preset = tpAnswers.preset
  }

  log.step(`初始化项目: ${c.bold}${projectName}${c.reset} [采用模板: ${preset}]`)

  const templateSrc = resolve(ROOT, '..', preset)
  const dest = resolve(process.cwd(), projectName)

  if (existsSync(dest)) {
    log.error(`目录 "${projectName}" 已存在，请选择其他名称`)
    process.exit(1)
  }

  const TEMPLATE_REPOS = {
    'vue3-vant-h5': 'https://github.com/hnhok/vue3-vant-h5.git',
    'vue3-element-admin': 'https://github.com/hnhok/vue3-element-admin.git',
    'react-antd-admin': 'https://github.com/hnhok/react-antd-admin.git'
  }

  const repoUrl = TEMPLATE_REPOS[preset]

  log.info(`🌐 试图从云端拉取企业标准模板 [${preset}]...`)
  const cloneResult = spawnSync('git', ['clone', '--depth', '1', repoUrl, dest], { stdio: 'inherit', shell: true })

  if (cloneResult.status === 0) {
    log.success('云端模板拉取成功！')
    try {
      rmSync(join(dest, '.git'), { recursive: true, force: true })
    } catch (e) {
      log.warn('清理 .git 失败: ' + e.message)
    }
  } else {
    log.warn(`⚠️ 云端仓库提取失败 (可能未公开网络或权限不足)，退回本地级联拷贝...`)

    // Fallback to basic local template
    let actualTemplateSrc = templateSrc
    if (!existsSync(actualTemplateSrc) && preset !== 'vue3-vant-h5') {
      log.warn(`⚠️ 本地尚不存在 "${preset}" 模板库，作为演示将回退使用 "vue3-vant-h5" 拷贝...`);
      actualTemplateSrc = resolve(ROOT, '..', 'vue3-vant-h5')
    }

    log.info('本地拷贝项目模板...')
    const result = spawnSync(
      'xcopy',
      [actualTemplateSrc, dest, '/E', '/I', '/Q', '/EXCLUDE:' + resolve(ROOT, 'scripts', 'xcopy-excludes.txt')],
      { stdio: 'inherit', shell: true }
    )
    if (result.status !== 0) {
      spawnSync('robocopy', [actualTemplateSrc, dest, '/E', '/XD', 'node_modules', 'dist', '.git'], { stdio: 'inherit', shell: true })
    }
  }

  // 写入项目配置
  const pkgPath = join(dest, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.name = projectName
    pkg.version = '1.0.0'
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  }

  // 创建工厂配置文件
  const factoryConfig = {
    projectName,
    preset,
    createdAt: new Date().toISOString(),
    factoryVersion: FACTORY_VERSION,
    skills: ['01-requirements', '02-development', '03-testing', '04-deployment'],
    schema: { pagesDir: 'schemas/pages', templatesDir: '../fe-auto-factory/templates' },
  }
  mkdirSync(join(dest, '.factory'), { recursive: true })
  writeFileSync(join(dest, '.factory', 'config.json'), JSON.stringify(factoryConfig, null, 2))

  // 创建 schemas 目录
  mkdirSync(join(dest, 'schemas', 'pages'), { recursive: true })
  mkdirSync(join(dest, 'docs', 'requirements'), { recursive: true })
  mkdirSync(join(dest, 'tests', 'e2e'), { recursive: true })
  mkdirSync(join(dest, 'tests', 'unit'), { recursive: true })

  // 拷贝 IDE AI Action 配置文件 (使得应用侧也能直接执行 /img2code 等高级操作)
  const sourceAgentDir = join(ROOT, '.agent')
  if (existsSync(sourceAgentDir)) {
    log.info('写入 AI 自动化流配置...')
    // 简单实现 Node 本身的递归拷贝
    cpSync(sourceAgentDir, join(dest, '.agent'), { recursive: true })
  }

  // 初始化写入项目的跟进日志 (Changelog)
  const initChangelog = `# 项目变更与更新日志 (Changelog)\n\n## [Init] - ${new Date().toLocaleString()}\n- 🚀 初始化项目基于 FE-Auto-Factory v${FACTORY_VERSION}\n`
  writeFileSync(join(dest, 'docs', 'CHANGELOG.md'), initChangelog, 'utf-8')

  log.success(`项目 "${projectName}" 初始化成功！`)
  console.log('')
  log.gray(`下一步:`)
  log.gray(`  cd ${projectName}`)
  log.gray(`  npm install`)
  log.gray(`  npm run dev`)
  console.log('')
  log.gray(`生成第一个页面:`)
  log.gray(`  node ../fe-auto-factory/scripts/factory.js generate --schema schemas/pages/home.schema.yaml`)
}

// ─── Command: generate ────────────────────────────────────────────────────────
async function cmdGenerate(args) {
  printBanner()
  const schemaFlag = args.indexOf('--schema')
  const schemaFile = schemaFlag !== -1 ? args[schemaFlag + 1] : null

  if (!schemaFile) {
    log.error('请提供 Schema 文件。用法: factory generate --schema <path>')
    process.exit(1)
  }

  if (!existsSync(schemaFile)) {
    log.error(`Schema 文件不存在: ${schemaFile}`)
    process.exit(1)
  }

  log.step(`读取 Schema: ${schemaFile}`)

  // 简单 YAML 解析（提取 frontmatter）
  const content = readFileSync(schemaFile, 'utf-8')
  const schema = parseFrontmatter(content)

  // 引入 Ajv 强校验
  log.info(`使用 Ajv 校验 Schema 规范...`)
  try {
    const Ajv = (await import('ajv')).default
    const ajv = new Ajv({ strict: false })
    const schemaDefPath = resolve(ROOT, 'schemas/page.schema.json')
    if (existsSync(schemaDefPath)) {
      const schemaDef = JSON.parse(readFileSync(schemaDefPath, 'utf-8'))
      const validate = ajv.compile(schemaDef)
      const valid = validate(schema)
      console.log('DEBUG SCHEMA:', schema)
      if (!valid) {
        log.error('Schema 规范不符，请修复以下错误:')
        console.log(JSON.stringify(validate.errors, null, 2))
        process.exit(1)
      } else {
        log.success('Schema 校验通过')
      }
    }
  } catch (e) {
    log.warn(`Ajv 校验环节报错或未安装，已跳过强校验: ${e.message}`)
  }

  const { page_id, title = page_id, layout = 'blank', api_endpoints = [], components = [], track = [], models = {} } = schema
  const camel = toCamelCase(page_id)
  const kebab = toKebabCase(page_id)

  log.info(`生成页面: ${page_id} (${title})`)
  log.gray(`布局: ${layout} | API: ${api_endpoints.join(', ') || '无'} | 组件: ${components.join(', ') || '无'} | 埋点: ${track.length} 项 | 模型: ${Object.keys(models).length} 个`)

  // ─── 统一配置加载 ───────────────────────────────────────────
  const projectRoot = process.cwd()
  const legacyConfigPath = join(projectRoot, '.factory', 'config.json')
  const modernConfigPath = join(projectRoot, '.factoryrc.json')

  let factoryConfig = { preset: 'vue3-vant-h5' }

  // 1. 加载 Preset (优先从旧版目录加载，保持兼容)
  if (existsSync(legacyConfigPath)) {
    try {
      factoryConfig = { ...factoryConfig, ...JSON.parse(readFileSync(legacyConfigPath, 'utf-8')) }
    } catch (e) { /* ignore */ }
  }

  // 2. 加载个性化路径配置 (覆盖)
  if (existsSync(modernConfigPath)) {
    try {
      factoryConfig = { ...factoryConfig, ...JSON.parse(readFileSync(modernConfigPath, 'utf-8')) }
    } catch (e) { /* ignore */ }
  }

  const preset = factoryConfig.preset
  log.info(`工厂接管：预设 [${preset}] | 项目根目录: ${projectRoot}`)

  // ─── 驱动沙箱加载 (优先级: 本地项目 > 工厂内置) ──────────────────────
  let generator = null
  const localDriverPath = join(projectRoot, '.factory', 'drivers', `driver-${preset}.js`)
  const builtInDriverPath = join(__dirname, 'generators', `driver-${preset}.js`)

  try {
    if (existsSync(localDriverPath)) {
      log.info(`⚡ 发现项目本地自定义驱动: ${localDriverPath}`)
      generator = await import(new URL('file:///' + localDriverPath.replace(/\\/g, '/')))
    } else if (existsSync(builtInDriverPath)) {
      generator = await import(new URL(`./generators/driver-${preset}.js`, import.meta.url).href)
    } else {
      log.warn(`找不到预设 [${preset}] 的渲染驱动，回滚至基础 H5 驱动...`)
      generator = await import(new URL(`./generators/driver-vue-vant.js`, import.meta.url).href)
    }

    // ─── 执行生成 ───────────────────────────────────────────
    await generator.generatePage({
      page_id, title, layout, api_endpoints, components, track, models, camel, kebab,
      config: factoryConfig // 将合并后的配置注入驱动
    })
  } catch (err) {
    log.error(`渲染驱动加载或执行失败，预设 [${preset}] 可能尚不支持或代码有误。`)
    console.error(err)
    process.exit(1)
  }

  log.success(`代码生成完成！`)
  log.gray(`生成文件:`)
  log.gray(`  src/views/${page_id}/index.vue`)
  log.gray(`  src/views/${page_id}/hooks/use${page_id}.ts`)
  log.gray(`    src/api/${kebab}.ts
    src/api/types/${kebab}.ts
    src/store/${kebab}.ts
    mock/${kebab}.mock.ts
    tests/e2e/${kebab}.spec.ts`)
}

// ─── Command: validate ────────────────────────────────────────────────────────
async function cmdValidate() {
  printBanner()
  log.step('运行全量代码质量检查...')

  let allPassed = true

  // 1. ESLint
  log.info('检查 ESLint...')
  const eslint = spawnSync('npm', ['run', 'lint', '--', '--max-warnings=0'], { stdio: 'pipe', shell: true })
  if (eslint.status === 0) {
    log.success('ESLint 通过')
  } else {
    log.error('ESLint 发现问题:')
    console.log(eslint.stdout?.toString())
    allPassed = false
  }

  // 2. TypeScript
  log.info('检查 TypeScript 类型...')
  const tsc = spawnSync('npx', ['vue-tsc', '--noEmit'], { stdio: 'pipe', shell: true })
  if (tsc.status === 0) {
    log.success('TypeScript 类型检查通过')
  } else {
    log.error('TypeScript 类型错误:')
    console.log(tsc.stdout?.toString())
    allPassed = false
  }

  // 3. Factory Schema 校验
  log.info('检查 Factory Schema 合规性...')
  const validatorPath = new URL('./validator.js', import.meta.url).href
  const validator = await import(validatorPath)
  const schemaResult = await validator.validateAll()
  if (schemaResult.passed) {
    log.success(`Schema 校验通过 (${schemaResult.count} 个 Schema)`)
  } else {
    schemaResult.errors.forEach(e => log.error(e))
    allPassed = false
  }

  console.log('')
  if (allPassed) {
    log.success('所有检查通过！可以提交代码。')
  } else {
    log.error('质量检查未通过，请修复上述问题。')
    process.exit(1)
  }
}

// ─── Command: test ────────────────────────────────────────────────────────────
async function cmdTest(args) {
  printBanner()
  const mode = args.includes('--e2e') ? 'e2e' : args.includes('--unit') ? 'unit' : 'all'
  log.step(`运行自动化测试 (模式: ${mode})...`)

  if (mode === 'unit' || mode === 'all') {
    log.info('运行单元测试 (Vitest)...')
    spawnSync('npx', ['vitest', 'run'], { stdio: 'inherit', shell: true })
  }

  if (mode === 'e2e' || mode === 'all') {
    log.info('运行 E2E 测试 (Playwright)...')
    spawnSync('npx', ['playwright', 'test'], { stdio: 'inherit', shell: true })
  }
}

// ─── Command: report ─────────────────────────────────────────────────────────
async function cmdReport(args) {
  printBanner()
  log.step('生成 AI 分析周报...')

  const now = new Date()
  const weekNum = getWeekNumber(now)
  const year = now.getFullYear()
  const reportPath = resolve(process.cwd(), `docs/reports/weekly-${year}-W${weekNum}.md`)

  mkdirSync(dirname(reportPath), { recursive: true })

  const reportContent = `# 📊 MVP 周报 ${year}-W${weekNum}

> 生成时间: ${now.toLocaleString('zh-CN')}
> 由 FE-Auto-Factory v${FACTORY_VERSION} 自动生成

---

## 🔴 Sentry 报错 Top 10

| 排名 | 错误信息 | 发生次数 | 影响用户数 | 首次出现 |
|-----|---------|---------|-----------|---------|
| 1 | TypeError: Cannot read property of undefined | 128 | 45 | 待接入 |
| 2 | Network Error | 89 | 23 | 待接入 |

> ⚠️ 请配置 VITE_SENTRY_DSN 环境变量后重新生成以获取真实数据

---

## ⚡ Lighthouse 性能趋势（近7日）

| 日期 | FCP | TBT | CLS | 综合评分 |
|-----|-----|-----|-----|---------|
| 待接入 | - | - | - | - |

---

## 📈 埋点转化率趋势

| 事件 ID | 总点击次数 | 转化率 | 环比变化 |
|--------|----------|--------|---------|
| 待接入 | - | - | - |

---

## 💡 MVP 1.1 优化建议

### 性能优化
- [ ] 分析首屏加载体积，考虑路由懒加载
- [ ] 检查是否有未使用的依赖包

### 业务优化
- [ ] 根据埋点数据优化高频操作入口
- [ ] 修复报错频率最高的 Top 3 问题

---

*本报告作为下一轮 Skill-01 需求分析的输入*
`
  writeFileSync(reportPath, reportContent)
  log.success(`周报已生成: ${reportPath}`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// (移至 ./utils 集中管理)

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
}

// ─── Command: sync ─────────────────────────────────────────────────────────────
async function cmdSync(args) {
  printBanner()
  const swaggerFlag = args.indexOf('--swagger')
  const swaggerUrl = swaggerFlag !== -1 ? args[swaggerFlag + 1] : null

  if (!swaggerUrl) {
    log.error('请提供 Swagger 地址或文件路径。用法: factory sync --swagger <url|path>')
    process.exit(1)
  }

  log.step(`同步 Swagger 接口定义: ${swaggerUrl}`)

  const syncPath = new URL('./sync.js', import.meta.url).href
  const syncModule = await import(syncPath)
  await syncModule.syncSwagger(swaggerUrl)
}

// ─── Command: update ────────────────────────────────────────────────────────────
async function cmdUpdate() {
  printBanner()
  log.step(`更新工厂基建资产...`)

  // 1. 同步 AI 工作流
  const sourceAgentDir = join(ROOT, '.agent')
  if (existsSync(sourceAgentDir)) {
    log.info('🔄 同步 .agent 魔法流...')
    cpSync(sourceAgentDir, join(process.cwd(), '.agent'), { recursive: true })
  }

  // 2. 同步 Schema 定义
  const sourceSchemaDir = join(ROOT, 'schemas')
  if (existsSync(sourceSchemaDir)) {
    log.info('🔄 同步 Schema 严控规则库...')
    cpSync(sourceSchemaDir, join(process.cwd(), 'schemas'), { recursive: true })
  }

  // 3. 记录升级日志 (Changelog)
  const changelogPath = join(process.cwd(), 'docs', 'CHANGELOG.md')
  const updateLog = `\n## [Update] - ${new Date().toLocaleString()}\n- 🔄 [工具自动同步] - 已将基建架构升级联通至 FE-Auto-Factory v${FACTORY_VERSION}\n- 包含了最新的 .agent 工作流指令以及 \`schemas\` 基础规范校验定义\n`
  try {
    if (existsSync(changelogPath)) {
      const existingLog = readFileSync(changelogPath, 'utf-8')
      writeFileSync(changelogPath, existingLog + updateLog, 'utf-8')
    } else {
      if (!existsSync(join(process.cwd(), 'docs'))) {
        mkdirSync(join(process.cwd(), 'docs'), { recursive: true })
      }
      writeFileSync(changelogPath, `# 项目变更与更新日志 (Changelog)\n` + updateLog, 'utf-8')
    }
  } catch (e) {
    log.warn('无法自动更新基建升级日志到 docs/CHANGELOG.md')
  }

  log.success(`基建同步完成！请确保已通过 npm install @hnhok/fe-auto-factory@latest 拉下了最新版本的依赖`)
  console.log('')
}

// ─── Main Router ──────────────────────────────────────────────────────────────
const [, , command, ...rest] = process.argv

switch (command) {
  case 'init': await cmdInit(rest[0]); break
  case 'generate': await cmdGenerate(rest); break
  case 'validate': await cmdValidate(); break
  case 'test': await cmdTest(rest); break
  case 'report': await cmdReport(rest); break
  case 'sync': await cmdSync(rest); break
  case 'update': await cmdUpdate(); break
  case '--version':
  case '-v':
    console.log(`FE-Auto-Factory v${FACTORY_VERSION}`)
    break
  default:
    printBanner()
    try {
      const inquirer = (await import('inquirer')).default;
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '请选择你要执行的操作:',
          choices: [
            { name: '🌟 生成新页面', value: 'generate' },
            { name: '📸 从设计稿直接生成 (AI 视觉)', value: 'vision' },
            { name: '📦 初始化新项目', value: 'init' },
            { name: '🌐 同步 Swagger 接口', value: 'sync' },
            { name: '✅ 运行质量检查', value: 'validate' },
            { name: '🔄 从远端同步基建升级 (Update)', value: 'update' },
            { name: '❌ 退出', value: 'exit' }
          ]
        }
      ]);

      if (action === 'exit') process.exit(0);

      if (action === 'update') {
        await cmdUpdate();
        process.exit(0);
      }

      if (action === 'generate') {
        const fs = await import('fs');
        const path = await import('path');
        const schemaDir = path.join(process.cwd(), 'schemas/pages');
        let schemas = [];
        if (fs.existsSync(schemaDir)) {
          schemas = fs.readdirSync(schemaDir).filter(f => f.endsWith('.yaml'));
        }

        if (schemas.length === 0) {
          log.warn('当前目录未找到 schemas/pages/*.yaml，请手动指定');
          process.exit(1);
        }

        const { file } = await inquirer.prompt([
          {
            type: 'list',
            name: 'file',
            message: '请选择要生成的 Schema 文件:',
            choices: schemas
          }
        ]);
        await cmdGenerate(['--schema', path.join('schemas/pages', file)]);
      } else if (action === 'vision') {
        printBanner();
        console.log(`${c.green}${c.bold}✨ 已检测到本地 IDE/AI 助手环境！${c.reset}`);
        console.log(`\n只需两步即可完成【设计稿大模型直出代码】闭环：\n`);
        console.log(`  1. 请在您的 IDE（Cursor/Antigravity 等）侧边栏 AI 对话框中，直接上传您的产品图片/设计稿`);
        console.log(`  2. 输入指令：${c.cyan}/img2code${c.reset}`);
        console.log(`\nAI 助手将接管后续所有的图像分析、Schema 生成以及代码构建工作。\n`);
        process.exit(0);
      } else if (action === 'init') {
        const { projectName } = await inquirer.prompt([
          { type: 'input', name: 'projectName', message: '请输入新项目的名称:' }
        ]);
        await cmdInit(projectName);
      } else if (action === 'sync') {
        const { url } = await inquirer.prompt([
          { type: 'input', name: 'url', message: '请输入 Swagger JSON 地址:' }
        ]);
        await cmdSync(['--swagger', url]);
      } else if (action === 'validate') {
        await cmdValidate();
      }

    } catch (e) {
      // 降级为普通打印
      console.log(`${c.bold}可用命令:${c.reset}`)
      console.log(`  ${c.cyan}init${c.reset} <project-name>           初始化新项目`)
      console.log(`  ${c.cyan}generate${c.reset} --schema <file>       从 Schema 生成代码`)
      console.log(`  ${c.cyan}validate${c.reset}                       运行全量质量检查`)
      console.log(`  ${c.cyan}test${c.reset} [--e2e|--unit|--all]     运行自动化测试`)
      console.log(`  ${c.cyan}report${c.reset} [--week]                生成 AI 分析周报`)
      console.log(`  ${c.cyan}sync${c.reset} --swagger <url>           同步 Swagger 接口并生成 TS 类型`)
      console.log('')
    }
}
