/**
 * OrderAuto E2E 测试 [工厂自动生成 - vant]
 */
import { test, expect } from '@playwright/test'

test.describe('OrderAuto — [机器生成] Order 页面', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/order-auto') })

  test('页面基础交互', async ({ page }) => {
    await expect(page.locator('[data-page-id="OrderAuto"]')).toBeVisible()
    await expect(page.locator('.van-nav-bar')).toBeVisible()
  })
})
