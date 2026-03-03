import { spawnSync } from 'child_process'
import { log, printBanner } from '../utils/logger.js'

export async function cmdTest(args) {
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
