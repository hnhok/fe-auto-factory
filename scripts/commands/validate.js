import { spawnSync } from 'child_process'
import { log, printBanner } from '../utils/logger.js'

export async function cmdValidate() {
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
    const validatorPath = new URL('../validator.js', import.meta.url).href
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
