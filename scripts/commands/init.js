import { readFileSync, writeFileSync, existsSync, cpSync, rmSync } from 'fs'
import { resolve, join } from 'path'
import { spawnSync } from 'child_process'
import inquirer from 'inquirer'
import { log, printBanner } from '../utils/logger.js'

export async function cmdInit(initialProjectName, FACTORY_VERSION, ROOT) {
    printBanner()

    let projectName = initialProjectName
    let preset = 'vue3-vant-h5'

    if (!projectName) {
        const answers = await inquirer.prompt([
            { type: 'input', name: 'projectName', message: '请输入新项目的名称:', validate: i => i ? true : '项目名称不能为空' }
        ])
        projectName = answers.projectName
    }

    const { selectedPreset } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedPreset',
            message: '请选择项目基础预设栈:',
            choices: [
                { name: 'Vue3 + Vant H5 模板 (默认推荐)', value: 'vue3-vant-h5' }
            ]
        }
    ])
    preset = selectedPreset

    log.step(`正在初始化新项目: ${projectName} [${preset}]`)

    const dest = join(process.cwd(), projectName)
    if (existsSync(dest)) {
        log.error(`目录已存在: ${dest}`)
        process.exit(1)
    }

    const baseTemplateSrc = join(ROOT, 'templates', 'base-vue3-vant')
    const actualTemplateSrc = resolve(ROOT, '../vue3-vant-h5-template') // Try sister directory first in monorepo

    if (!existsSync(actualTemplateSrc) && !existsSync(baseTemplateSrc)) {
        log.error(`找不到基础项目模板资产，请检查。期望位于: ${actualTemplateSrc} 或 ${baseTemplateSrc}`)
        process.exit(1)
    }

    if (existsSync(baseTemplateSrc)) {
        log.info('从内置模板复制...')
        cpSync(baseTemplateSrc, dest, { recursive: true })
    } else {
        if (existsSync(join(actualTemplateSrc, 'node_modules'))) {
            log.warn('检测到 node_modules, 为了加快复制速度，请在源模板目录中清理。临时跳过...')
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

    const factoryDir = join(dest, '.factory')
    if (!existsSync(factoryDir)) {
        import('fs').then(fs => fs.mkdirSync(factoryDir, { recursive: true }))
    }
    writeFileSync(join(factoryDir, 'config.json'), JSON.stringify(factoryConfig, null, 2), 'utf-8')
    writeFileSync(join(dest, '.factoryrc.json'), JSON.stringify(factoryConfig, null, 2), 'utf-8')

    // 写入项目级 Changelog 占位图
    const initChangelog = `# ${projectName} 变更与演进记录\n\n## [初始化] - ${new Date().toLocaleString()}\n- 基于 FE-Auto-Factory v${FACTORY_VERSION} ([${preset}]) 孵化落地\n`
    const docsDir = join(dest, 'docs')
    if (!existsSync(docsDir)) {
        import('fs').then(fs => fs.mkdirSync(docsDir, { recursive: true }))
    }
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
