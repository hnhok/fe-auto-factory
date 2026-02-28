import { defineConfig, devices } from '@playwright/test'

/**
 * FE-Factory Playwright 测试配置
 * 覆盖 E2E 测试 + 视觉回归测试
 */
export default defineConfig({
    // 测试文件目录
    testDir: './e2e',

    // 全局超时
    timeout: 30 * 1000,
    expect: {
        timeout: 5000,
        // 视觉对比允许差异阈值（像素级 1%）
        toHaveScreenshot: {
            threshold: 0.01,
            maxDiffPixelRatio: 0.01,
        },
    },

    // 完全并行执行
    fullyParallel: true,

    // CI 环境禁止 test.only
    forbidOnly: !!process.env.CI,

    // CI 环境失败重试次数
    retries: process.env.CI ? 2 : 0,

    // 并发 workers
    workers: process.env.CI ? 4 : undefined,

    // 报告格式
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
        ...(process.env.CI ? [['github'] as [string]] : []),
    ],

    // 快照存储目录
    snapshotDir: './snapshots',

    // 全局测试配置
    use: {
        // 基础 URL（从环境变量读取）
        baseURL: process.env.BASE_URL || 'http://localhost:4173',

        // 截图：仅在失败时
        screenshot: 'only-on-failure',

        // 视频：仅在失败时录制
        video: 'retain-on-failure',

        // 追踪：仅在失败时
        trace: 'retain-on-failure',

        // 视口（H5 移动端）
        viewport: { width: 375, height: 812 },

        // 模拟 iPhone 14
        ...devices['iPhone 14'],

        // 忽略 HTTPS 证书错误
        ignoreHTTPSErrors: true,
    },

    // 多浏览器配置
    projects: [
        // H5 主要目标：移动端 Chrome
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 7'] },
        },

        // H5 次要目标：移动端 Safari
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 14'] },
        },

        // 视觉回归测试（独立 project，通过 @visual tag 标记）
        {
            name: 'Visual Regression',
            use: { ...devices['Pixel 7'] },
            testMatch: '**/*.visual.spec.ts',
        },
    ],

    // 本地开发时自动启动 dev server
    webServer: process.env.CI
        ? undefined
        : {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: true,
            timeout: 30 * 1000,
        },
})
