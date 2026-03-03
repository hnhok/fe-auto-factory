#!/usr/bin/env node
/**
 * FE-Auto-Factory CLI
 * Usage: node scripts/factory.js <command> [options]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { toKebabCase, toCamelCase } from './utils/string.js'
import { parseFrontmatter } from './utils/schema.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FACTORY_VERSION = '3.3.0'

import { log, printBanner, c } from './utils/logger.js'

// ─── Command: init ────────────────────────────────────────────────────────────
async function cmdInit(initialProjectName) {
  const { cmdInit: _cmdInit } = await import('./commands/init.js')
  await _cmdInit(initialProjectName, FACTORY_VERSION, ROOT)
}

// ─── Command: generate ────────────────────────────────────────────────────────
async function cmdGenerate(args) {
  const { cmdGenerate: _cmdGenerate } = await import('./commands/generate.js')
  await _cmdGenerate(args, loadGlobalModels, __dirname)
}

// ─── Command: validate ────────────────────────────────────────────────────────
async function cmdValidate() {
  const { cmdValidate: _cmdValidate } = await import('./commands/validate.js')
  await _cmdValidate()
}

// ─── Command: test ────────────────────────────────────────────────────────────
async function cmdTest(args) {
  const { cmdTest: _cmdTest } = await import('./commands/test.js')
  await _cmdTest(args)
}

// ─── Command: vision (with snapshot system) ──────────────────────────────────
async function cmdVision(args) {
  const { cmdImgToCode, cmdSnapshotList, cmdSnapshotDelete } = await import('./vision.js')
  const subCmd = args[0]
  // snapshot sub-commands
  if (subCmd === 'snapshot') {
    const subAction = args[1]
    if (subAction === 'list') return cmdSnapshotList()
    if (subAction === 'delete') return cmdSnapshotDelete(args[2])
    console.log('Usage: vision snapshot list | vision snapshot delete <id>')
    return
  }
  // direct: vision <imagePath> [--force] [--note "..."]
  const imagePath = args.find(a => !a.startsWith('--'))
  if (!imagePath) {
    console.log('Usage: npx fe-factory vision <imagePath> [--force] [--note "..."]')
    return
  }
  const force = args.includes('--force')
  const noteIdx = args.indexOf('--note')
  const note = noteIdx !== -1 ? (args[noteIdx + 1] || '') : ''
  await cmdImgToCode(imagePath, { force, note })
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

/**
 * [FACTORY-DOCTOR] 环境健康检查与自愈
 */
async function cmdDoctor() {
  printBanner()
  log.step('开始诊断前端自动化工厂环境...')

  const cwd = process.cwd()
  const checks = [
    { name: 'Node.js 版本', check: () => process.version.startsWith('v20') || process.version.startsWith('v22'), fix: '请升级 Node.js 至 v20+' },
    { name: '依赖: ts-morph', check: () => existsSync(join(cwd, 'node_modules', 'ts-morph')) },
    { name: '依赖: ajv', check: () => existsSync(join(cwd, 'node_modules', 'ajv')) },
    { name: '依赖: js-yaml', check: () => existsSync(join(cwd, 'node_modules', 'js-yaml')) },
    { name: '配置文件: .factoryrc.json 或 .factory/config.json', check: () => existsSync(join(cwd, '.factoryrc.json')) || existsSync(join(cwd, '.factory/config.json')) },
    {
      name: '路径别名: tsconfig.json (@/*)', check: () => {
        if (!existsSync(join(cwd, 'tsconfig.json'))) return false
        const tsconfig = readFileSync(join(cwd, 'tsconfig.json'), 'utf-8')
        return tsconfig.includes('"@/*"')
      }
    }
  ]

  let hasError = false
  for (const item of checks) {
    const ok = item.check()
    if (ok) {
      console.log(`  ${c.green}✔${c.reset} ${item.name} 正常`)
    } else {
      console.log(`  ${c.red}✘${c.reset} ${item.name} 异常! ${item.fix || '(提示: 请检查 npm install 或配置文件)'}`)
      hasError = true
    }
  }

  if (!hasError) {
    log.success('诊断完成：工厂环境非常健康！')
  } else {
    log.warn('诊断发现部分潜在风险，请根据提示进行修复。')
  }
}

/**
 * 加载全局公用模型池 (.factory/models/*.yaml)
 */
function loadGlobalModels(cwd) {
  const modelDir = join(cwd, '.factory', 'models')
  if (!existsSync(modelDir)) return {}

  try {
    const files = readdirSync(modelDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    let globalModels = {}

    files.forEach(file => {
      const content = readFileSync(join(modelDir, file), 'utf-8')
      const data = parseFrontmatter(content)
      globalModels = { ...globalModels, ...data }
    })
    return globalModels
  } catch (e) {
    return {}
  }
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

async function cmdUI(args) {
  const { startUIServer } = await import('./ui/server.js')
  startUIServer(4000)
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
  case 'doctor': await cmdDoctor(); break
  case 'update': await cmdUpdate(); break
  case 'ui': await cmdUI(rest); break
  case 'vision': await cmdVision(rest); break
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
            { name: '📸 从设计稿直接生成 (AI 视觉 + 快照复用)', value: 'vision' },
            { name: '📚 查看历史快照库', value: 'snapshot-list' },
            { name: '📦 初始化新项目', value: 'init' },
            { name: '🩺 运行环境诊断与自愈', value: 'doctor' },
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
        const { imagePath: visionPath } = await inquirer.prompt([
          { type: 'input', name: 'imagePath', message: '请输入设计稿/原型图的文件路径 (image path):' }
        ]);
        await cmdVision([visionPath]);
      } else if (action === 'snapshot-list') {
        const { cmdSnapshotList } = await import('./vision.js');
        cmdSnapshotList();
      } else if (action === 'doctor') {
        await cmdDoctor();
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
      console.log(`  ${c.cyan}doctor${c.reset}                         运行环境诊断与自愈`)
      console.log(`  ${c.cyan}validate${c.reset}                       运行全量质量检查`)
      console.log(`  ${c.cyan}test${c.reset} [--e2e|--unit|--all]     运行自动化测试`)
      console.log(`  ${c.cyan}report${c.reset} [--week]                生成 AI 分析周报`)
      console.log(`  ${c.cyan}sync${c.reset} --swagger <url>           同步 Swagger 接口并生成 TS 类型`)
      console.log('')
    }
}
