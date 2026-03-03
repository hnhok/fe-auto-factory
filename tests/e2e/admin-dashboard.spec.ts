/**
 * AdminDashboard E2E 测试 [工厂自动生成 - vant]
 */
import { test, expect } from '@playwright/test'

test.describe('AdminDashboard — 后台控制面板', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/admin-dashboard') })

  test('页面基础交互', async ({ page }) => {
    await expect(page.locator('[data-page-id="AdminDashboard"]')).toBeVisible()
    await expect(page.locator('.van-nav-bar')).toBeVisible()
  })
})
