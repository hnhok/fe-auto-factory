import { readFileSync, writeFileSync, existsSync, cpSync, rmSync } from 'fs'
import { resolve, join } from 'path'
import { spawnSync } from 'child_process'
import inquirer from 'inquirer'
import { log, printBanner } from '../utils/logger.js'

export async function cmdInit(initialProjectName, FACTORY_VERSION, ROOT) {
    printBanner()

    let projectName = initialProjectName
    let preset = ''

    // 1. 获取项目名称
    if (!projectName) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: '请输入新项目的名称:',
                default: 'my-factory-project',
                validate: i => i ? true : '项目名称不能为空'
            }
        ])
        projectName = answers.projectName
    }

    // 2. 选择预设栈 (v3.4.0 扩充)
    const { selectedPreset } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedPreset',
            message: '请选择项目基础预设栈 (Presets):',
            choices: [
                { name: 'Vue3 + Element-Plus (后台管理系统 - 推荐)', value: 'vue3-element-admin' },
                { name: 'React + Ant-Design (后台管理系统)', value: 'react-antd-admin' },
                { name: 'Vue3 + Vant (移动端 H5)', value: 'vue3-vant-h5' },
                { name: '自定义模板 (NPM / Git)', value: 'custom' }
            ]
        }
    ])
    preset = selectedPreset

    if (preset === 'custom') {
        log.warn('自定义模板功能正在灰度中，请先选择内置预设。')
        process.exit(0)
    }

    log.step(`正在初始化新项目: ${projectName} [${preset}]`)

    const dest = join(process.cwd(), projectName)
    if (existsSync(dest)) {
        log.error(`目录已存在: ${dest}`)
        process.exit(1)
    }

    // 3. 寻找模板资产
    // 逻辑：优先寻找同级目录的模板项目 (Local Monorepo Path)，兜底寻找内置 templates/base-*
    const localTemplatePath = resolve(ROOT, '..', preset)
    const builtInTemplatePath = join(ROOT, 'templates', `base-${preset}`)

    let finalSrc = ''
    if (existsSync(localTemplatePath)) {
        finalSrc = localTemplatePath
    } else if (existsSync(builtInTemplatePath)) {
        finalSrc = builtInTemplatePath
    }

    if (!finalSrc) {
        log.error(`找不到预设 [${preset}] 的模板资产。`)
        log.gray(`期望路径: ${localTemplatePath} 或 ${builtInTemplatePath}`)
        process.exit(1)
    }

    log.info(`从资产源拷贝: ${finalSrc}`)

    // 拷贝策略：排除 node_modules, dist, .git
    try {
        // 使用 cpSync (Node 16+)
        cpSync(finalSrc, dest, {
            recursive: true,
            filter: (src) => {
                const isIgnored = /node_modules|dist|\.git|tsbuildinfo/.test(src)
                return !isIgnored
            }
        })
    } catch (err) {
        log.error('拷贝过程中出现错误，尝试使用 robocopy (Windows 备份) 兜底...')
        spawnSync('robocopy', [finalSrc, dest, '/E', '/XD', 'node_modules', 'dist', '.git'], { shell: true })
    }

    // 4. 更新 package.json
    const pkgPath = join(dest, 'package.json')
    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
            pkg.name = projectName
            pkg.version = '1.0.0'
            pkg.description = `Based on FE-Auto-Factory v${FACTORY_VERSION} (${preset})`
            // 去除不必要的仓库信息
            delete pkg.repository
            writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')
        } catch (e) {
            log.warn('无法更新 package.json 的项目元数据')
        }
    }

    // 5. 创建工厂配置文件 .factory/config.json
    const factoryConfig = {
        projectName,
        preset,
        createdAt: new Date().toISOString(),
        factoryVersion: FACTORY_VERSION,
        skills: ['01-requirements', '02-development', '03-testing', '04-deployment', '05-component-reuse', '06-vision-snapshot'],
        schema: {
            pagesDir: 'schemas/pages'
        },
    }

    const factoryDir = join(dest, '.factory')
    if (!existsSync(factoryDir)) {
        mkdirSync(factoryDir, { recursive: true })
    }
    writeFileSync(join(factoryDir, 'config.json'), JSON.stringify(factoryConfig, null, 2), 'utf-8')

    // 6. 写入初始化文档
    const docsDir = join(dest, 'docs')
    if (!existsSync(docsDir)) {
        mkdirSync(docsDir, { recursive: true })
    }
    const initLog = `# ${projectName} 变更日志\n\n## [v1.0.0] - ${new Date().toLocaleDateString()}\n- ⚡ 由 FE-Auto-Factory 初始化落地\n- 预设栈: ${preset}\n- 引擎版本: v${FACTORY_VERSION}\n`
    writeFileSync(join(docsDir, 'CHANGELOG.md'), initLog, 'utf-8')

    log.success(`项目 "${projectName}" 初始化成功！`)
    console.log('')
    log.gray(`🚀 开启赋能之路:`)
    log.gray(`  1. cd ${projectName}`)
    log.gray(`  2. npm install`)
    log.gray(`  3. npm run dev`)
    console.log('')
    log.info(`💡 接下来，您可以投掷 Swagger 文档或设计稿来生成页面了！`)
}

