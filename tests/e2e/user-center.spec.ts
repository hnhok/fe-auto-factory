/**
 * UserCenter E2E 测试 [工厂自动生成 - vant]
 */
import { test, expect } from '@playwright/test'

test.describe('UserCenter — 普通H5用户中心', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/user-center') })

  test('页面基础交互', async ({ page }) => {
    await expect(page.locator('[data-page-id="UserCenter"]')).toBeVisible()
    await expect(page.locator('.van-nav-bar')).toBeVisible()
  })
})
