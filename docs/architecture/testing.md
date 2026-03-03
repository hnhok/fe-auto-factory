# 基于 Schema 的前端防退化测试机制 (Testing)

在绝大多数团队中，前端开发常常伴随“我改了个组件参数，怎么其他页面的表格不显示了？”的故障。而手工写 E2E 测试因为收益低、维护成本极大，几乎没有业务线能坚持。

在 `FE-Auto-Factory` 中，**测试不靠人工写，全由机器生！**

## 1. 自动生成 Playwright E2E 脚本

当你在图纸（Schema）中配置了页面能力时，内核自带的沙箱适配器（如 `vue3-element-admin`）不仅渲染页面，还会同步生成对该页面的黑盒断言环境！

例如，如果你的 Schema 中标明了 `features: { search_bar: true }` 且携带了 `models: ProductList`。
系统会自动在项目的 `tests/e2e/product-list.spec.ts` 目录下吐出以下代码断言：

```typescript
import { test, expect } from '@playwright/test';

test.describe('ProductList 业务页面黑盒回归', () => {
  test.beforeEach(async ({ page }) => {
    // 根据约定路由结构自动拼入
    await page.goto('/product-list'); 
  });

  test('页面基础 Layout 及标题装载', async ({ page }) => {
    await expect(page).toHaveTitle(/商品大盘管理/);
  });

  // 👇 是的，因为你开启了 Search Bar，它自动帮你写好了检索的测试！
  test('支持检索与数据流筛选', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="请输入关键字"]');
    await expect(searchInput).toBeVisible();
    
    // 它甚至基于你给的 Models 生成假入参
    await searchInput.fill('MockProduct');
    await page.click('button:has-text("检索")');
    
    // 大聪明地等待骨架屏或者 loading 结束
    await expect(page.locator('.el-table')).toBeVisible();
  });
});
```

## 2. Vitest 业务 Hook 单测保护

我们把状态抽离进 `useProduct.ts` 的初衷，就是让非 UI 逻辑处于纯净可测的环境。
引擎会根据你填入的 `api_endpoints: [queryProductList]` 为你提供默认的 Mock 服务，并直接写入对应的 `.spec.ts` 文件。

你可以看到引擎甚至给你配好了如何去调用你的 `interface` 泛型请求：

```typescript
// 自动生成的 useProduct.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useProductList } from '../hooks/useProductList'
import * as Service from '@/api/product-list'

describe('useProductList() 状态管理保护', () => {
    it('发起 queryProductList 时，应当流转 Loading 态并将数据压入 List', async () => {
       // ... 引擎自动填装的断言验证
    })
})
```

## 3. 当作流水线的保险丝

有了免费的生化武器护航，你可以非常自豪地在您公司的 Gitlab CI、GitHub Actions 或者是 Jenkins 当中注入我们 `Skill` 的核心命令！

```yaml
# github-action.yml
jobs:
  validate-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      
      # 1. 代码格式化红线扫描（基于 fe-factory-rules.js）
      - run: npx fe-factory validate
      
      # 2. 拉起虚拟浏览器环境！执行页面防退化碰撞
      - run: npx fe-factory test
```

只有当 `test` 发电机通过所有的检查点之后，您的这套系统才会被允许部署。借此，我们可以极其从容地把故障扼杀在摇篮里！
