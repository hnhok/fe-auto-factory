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

export const log = {
    info: (msg) => console.log(`${c.cyan}[Factory]${c.reset} ${msg}`),
    success: (msg) => console.log(`${c.green}✅ ${msg}${c.reset}`),
    warn: (msg) => console.log(`${c.yellow}⚠️  ${msg}${c.reset}`),
    error: (msg) => console.error(`${c.red}❌ ${msg}${c.reset}`),
    step: (msg) => console.log(`${c.bold}${c.blue}▶ ${msg}${c.reset}`),
    gray: (msg) => console.log(`${c.gray}  ${msg}${c.reset}`),
}

export function printBanner(version = '2.10.0') {
    console.log(`${c.cyan}${c.bold}`)
    console.log('╔══════════════════════════════════════════╗')
    console.log('║        🏭  FE-Auto-Factory  v' + version.padEnd(12) + '║')
    console.log('║   前端自动化工厂 · Schema驱动开发流水线  ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(c.reset)
}

export { c }
