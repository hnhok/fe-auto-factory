---
name: automated-testing
description: >
  阶段3：自动化测试 & 质量守卫。基于 PRD User Story 自动生成 E2E 脚本，
  结合 Playwright 视觉回归和 Lighthouse CI 性能基准，构建不可见的测试体系。
---

# 🧪 Skill 03 — 自动化测试 & 质量守卫

## 目标
让测试在开发过程中"隐身"，在 CI 流水线中"强悍"。**零人工干预的测试执行**，质量问题自动阻断部署。

---

## 步骤一：从 User Story 自动生成 E2E 脚本

### 输入：PRD 中的 User Story

```markdown
## User Story
- 作为管理员，我可以查看订单的完整信息
- 作为管理员，我可以更新订单状态
- 作为管理员，我可以取消订单并填写原因
```

### 执行命令

```bash
node scripts/factory.js gen-tests --schema schemas/pages/order-detail.schema.yaml
```

### 生成：`tests/e2e/order-detail.spec.ts`

```typescript
// [FACTORY-GENERATED] 基于 User Story 自动生成
import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'

test.describe('OrderDetail - 订单详情页', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/order/test-order-001')
  })

  test('管理员可以查看订单完整信息', async ({ page }) => {
    // 等待数据加载完成
    await expect(page.locator('[data-page-id="OrderDetail"]')).toBeVisible()
    await expect(page.locator('.van-loading')).not.toBeVisible()
    // 验证关键信息字段存在
    await expect(page.locator('[data-testid="order-id"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible()
  })

  test('管理员可以更新订单状态', async ({ page }) => {
    await page.click('[data-track-id="status-update-click"]')
    await expect(page.locator('.van-action-sheet')).toBeVisible()
    await page.click('[data-testid="status-option-shipped"]')
    await expect(page.locator('.van-toast')).toContainText('更新成功')
  })

  test('管理员可以取消订单并填写原因', async ({ page }) => {
    await page.click('[data-track-id="order-cancel-click"]')
    await expect(page.locator('.van-dialog')).toBeVisible()
    await page.fill('[data-testid="cancel-reason-input"]', '客户申请退款')
    await page.click('[data-testid="cancel-confirm-btn"]')
    await expect(page.locator('[data-testid="order-status"]')).toContainText('已取消')
  })
})
```

---

## 步骤二：视觉回归测试（Visual Regression）

### 配置（`tests/playwright.config.ts`）

```typescript
export default {
  // 截图快照存储
  snapshotDir: './tests/snapshots',
  // 允许差异阈值：像素级 1%
  expect: { toHaveScreenshot: { threshold: 0.01 } }
}
```

### 关键组件快照列表

运行命令自动截取 50 个关键组件快照：

```bash
node scripts/factory.js snapshot --update   # 更新基准快照
node scripts/factory.js snapshot            # 对比基准快照
```

超过 **1% 差异** 自动阻断 CI 部署，并在 PR 中贴出对比图。

---

## 步骤三：性能基准测试（Lighthouse CI）

### 指标阈值（`lighthouserc.json`）

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

### CI 集成

- FCP > 2s → ❌ 自动标注导致变慢的依赖包
- TBT > 300ms → ❌ 阻断部署 + PR 评论告警
- 趋势数据写入 `telemetry/perf-history.json`

---

## 步骤四：单元测试（Vitest）

### 测试规范

每个 Composable Hook 必须有对应单元测试：

```typescript
// tests/unit/hooks/useOrderDetail.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useOrderDetail } from '@/views/OrderDetail/hooks/useOrderDetail'

describe('useOrderDetail', () => {
  it('初始化时 loading 为 false', () => {
    const { loading } = useOrderDetail()
    expect(loading.value).toBe(false)
  })

  it('fetchData 时 loading 变为 true', async () => {
    // ... mock API 调用
  })
})
```

---

## 步骤五：测试覆盖率要求

| 类型 | 目标覆盖率 | 工具 |
|------|----------|------|
| 单元测试 Hook | ≥ 80% | Vitest |
| E2E 关键流程 | 100% User Story | Playwright |
| 视觉回归 | 所有页面快照 | Playwright |
| 性能基准 | FCP < 2s | Lighthouse CI |

```bash
# 运行全量测试
node scripts/factory.js test --all

# 只运行 E2E
node scripts/factory.js test --e2e

# 只运行单元测试
node scripts/factory.js test --unit
```

---

## ✅ 阶段3 完成标志

- [ ] E2E 测试脚本已生成并通过
- [ ] 视觉快照基准已建立
- [ ] Lighthouse 分数 ≥ 85
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] CI 流水线全绿

---

## 📂 产出物

```
tests/e2e/[page-id].spec.ts          # E2E 测试脚本
tests/unit/hooks/use[PageId].spec.ts  # Hook 单元测试
tests/snapshots/[page-id]/*.png       # 视觉基准快照
lighthouserc.json                     # 性能基准配置
```
