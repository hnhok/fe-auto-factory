#!/usr/bin/env node
/**
 * FE-Auto-Factory CLI
 * Usage: node scripts/factory.js <command> [options]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync, spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FACTORY_VERSION = '2.0.0'

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
async function cmdInit(projectName) {
  if (!projectName) {
    log.error('请提供项目名称。用法: factory init <project-name>')
    process.exit(1)
  }
  printBanner()
  log.step(`初始化项目: ${c.bold}${projectName}${c.reset}`)

  const templateSrc = resolve(ROOT, '..', 'vue3-vant-h5')
  const dest = resolve(process.cwd(), projectName)

  if (existsSync(dest)) {
    log.error(`目录 "${projectName}" 已存在，请选择其他名称`)
    process.exit(1)
  }

  log.info('拷贝项目模板...')
  // Windows 兼容的拷贝方式
  const result = spawnSync(
    'xcopy',
    [templateSrc, dest, '/E', '/I', '/Q', '/EXCLUDE:' + resolve(ROOT, 'scripts', 'xcopy-excludes.txt')],
    { stdio: 'inherit', shell: true }
  )
  if (result.status !== 0) {
    // fallback: 用 robocopy
    spawnSync('robocopy', [templateSrc, dest, '/E', '/XD', 'node_modules', 'dist', '.git'], { stdio: 'inherit', shell: true })
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
    const ajv = new Ajv()
    const schemaDefPath = resolve(ROOT, 'schemas/page.schema.json')
    if (existsSync(schemaDefPath)) {
      const schemaDef = JSON.parse(readFileSync(schemaDefPath, 'utf-8'))
      const validate = ajv.compile(schemaDef)
      const valid = validate(schema)
      if (!valid) {
        log.error('Schema 规范不符，请修复以下错误:')
        validate.errors.forEach(err => {
          console.log(`  ${c.red}- [${err.instancePath || 'root'}] ${err.message}${c.reset}`)
        })
        process.exit(1)
      }
    }
  } catch (e) {
    log.warn(`Ajv 校验环节报错或未安装，已跳过强校验: ${e.message}`)
  }

  const { page_id, title = page_id, layout = 'blank', api_endpoints = [], components = [] } = schema
  const camel = toCamelCase(page_id)
  const kebab = toKebabCase(page_id)

  log.info(`生成页面: ${page_id} (${title})`)
  log.gray(`布局: ${layout} | API: ${api_endpoints.join(', ') || '无'} | 组件: ${components.join(', ') || '无'}`)

  // 读取模板并渲染
  const generatorPath = new URL('./generator.js', import.meta.url).href
  const generator = await import(generatorPath)
  await generator.generatePage({ page_id, title, layout, api_endpoints, components, camel, kebab })

  log.success(`代码生成完成！`)
  log.gray(`生成文件:`)
  log.gray(`  src/views/${page_id}/index.vue`)
  log.gray(`  src/views/${page_id}/hooks/use${page_id}.ts`)
  log.gray(`  src/api/${kebab}.ts`)
  log.gray(`  src/store/${kebab}.ts`)
  log.gray(`  tests/e2e/${kebab}.spec.ts`)
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
function parseFrontmatter(content) {
  // 支持 CRLF 和 LF 换行
  const normalized = content.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const yaml = match[1]
  const result = {}
  let currentKey = null

  for (const line of yaml.split('\n')) {
    // 多行数组项（- value 格式）
    const arrayItemMatch = line.match(/^\s+-\s+(.+)/)
    if (arrayItemMatch) {
      if (currentKey && Array.isArray(result[currentKey])) {
        result[currentKey].push(arrayItemMatch[1].trim())
      }
      continue
    }

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    if (!key || key.startsWith('#')) continue
    const raw = line.slice(colonIdx + 1).trim()
    currentKey = key

    if (raw === '' || raw === '[]') {
      // 空值 or 空数组：等待后续行填充
      result[key] = []
    } else if (raw.startsWith('[')) {
      // 行内数组：[a, b, c]
      result[key] = raw.slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      result[key] = raw.replace(/^['"]|['"]$/g, '')
    }
  }
  return result
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function toKebabCase(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

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

// ─── Main Router ──────────────────────────────────────────────────────────────
const [, , command, ...rest] = process.argv

switch (command) {
  case 'init': await cmdInit(rest[0]); break
  case 'generate': await cmdGenerate(rest); break
  case 'validate': await cmdValidate(); break
  case 'test': await cmdTest(rest); break
  case 'report': await cmdReport(rest); break
  case 'sync': await cmdSync(rest); break
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
            { name: '📦 初始化新项目', value: 'init' },
            { name: '🌐 同步 Swagger 接口', value: 'sync' },
            { name: '✅ 运行质量检查', value: 'validate' },
            { name: '❌ 退出', value: 'exit' }
          ]
        }
      ]);

      if (action === 'exit') process.exit(0);

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
