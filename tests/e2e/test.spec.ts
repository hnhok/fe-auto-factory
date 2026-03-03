/**
 * Test E2E 测试 [工厂自动生成 - vant]
 */
import { test, expect } from '@playwright/test'

test.describe('Test — test', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/test') })

  test('页面基础交互', async ({ page }) => {
    await expect(page.locator('[data-page-id="Test"]')).toBeVisible()
    await expect(page.locator('.van-nav-bar')).toBeVisible()
  })
})
