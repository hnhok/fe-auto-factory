---
name: deployment-telemetry
description: >
  阶段4：上线部署 & 反馈闭环。自动化 CI/CD 流水线、声明式埋点系统、
  线上错误追踪与 AI 周报生成，将上线后数据自动流向下一轮需求池。
---

# 🚀 Skill 04 — 上线部署 & 反馈闭环

## 目标
上线不是终点，而是下一轮优化的起点。通过**自动化遥测 + AI 分析**，将生产环境数据闭环回需求池。

---

## 步骤一：CI/CD 流水线（GitHub Actions）

### 完整流水线（`.github/workflows/ci.yml`）

```yaml
name: FE-Factory CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    name: 🔍 质量守卫
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: ESLint 检查
        run: npm run lint
      - name: TypeScript 类型检查
        run: npm run type-check
      - name: 单元测试
        run: npm run test:unit
      - name: 构建验证
        run: npm run build

  e2e-tests:
    name: 🎭 E2E 自动化测试
    needs: quality-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: 启动预览服务
        run: npm run preview &
      - name: 运行 E2E 测试
        run: npm run test:e2e
      - name: 视觉回归对比
        run: npm run test:visual
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: tests/playwright-report/

  lighthouse:
    name: ⚡ 性能基准检测
    needs: quality-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true

  deploy:
    name: 🚀 自动部署
    needs: [e2e-tests, lighthouse]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: 部署到服务器
        run: |
          node scripts/factory.js deploy --env production
      - name: 发送部署通知
        run: |
          node scripts/factory.js notify --message "✅ 部署成功 $(date)"
```

---

## 步骤二：声明式埋点系统

### 使用方式（在模板中声明）

```vue
<!-- 只需在元素上添加 data-track-id，无需手动写埋点代码 -->
<van-button
  data-track-id="order-cancel-click"
  @click="cancelOrder"
>
  取消订单
</van-button>
```

### 全局拦截器（`telemetry/tracker.ts`）

```typescript
// 系统自动采集所有带 data-track-id 的元素交互
class ClickInterceptor {
  init() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const trackId = target.closest('[data-track-id]')
        ?.getAttribute('data-track-id')
      if (trackId) {
        this.track({
          event: trackId,
          timestamp: Date.now(),
          page: window.location.pathname,
          userId: this.getUserId(),
        })
      }
    }, true)
  }

  track(data: TrackEvent) {
    // 发送至数据看板
    navigator.sendBeacon('/api/track', JSON.stringify(data))
  }
}

export const tracker = new ClickInterceptor()
```

---

## 步骤三：线上错误实时追踪

### Sentry 配置（`src/plugins/sentry.ts`）

```typescript
import * as Sentry from '@sentry/vue'

export function initSentry(app: App) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      // Session Replay：错误前 30 秒录制
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        sessionSampleRate: 0,
        errorSampleRate: 1.0, // 100% 错误触发录制
      }),
    ],
    tracesSampleRate: 0.1,
    // 关联到具体 PR 和代码行
    release: import.meta.env.VITE_RELEASE_VERSION,
  })
}
```

**效果**：JS Error 发生时，自动录制错误前 30 秒用户操作视频。

---

## 步骤四：AI 周报自动生成

每周一自动执行，汇总：
- Sentry 报错 Top 10（按频率排序）
- Lighthouse 性能趋势（FCP/TBT 7日曲线）
- 埋点转化率趋势（关键按钮点击率）
- 新增 vs 已解决 Bug 对比

```bash
# 手动触发周报生成
node scripts/factory.js report --week
```

**输出**：`docs/reports/weekly-2026-W08.md`

---

## 步骤五：自修复流程

当线上报错频率超过阈值（默认 50次/小时）：

1. 系统自动关联错误堆栈到具体 PR 号
2. 找到引入错误的代码行（通过 source map）
3. 在 Sentry + GitHub PR 同时创建告警评论
4. 触发热修复流程或自动回滚

```bash
# 快速回滚到指定版本
node scripts/factory.js rollback --version v1.2.3
```

---

## ✅ 阶段4 完成标志

- [ ] CI/CD 流水线全绿
- [ ] Sentry 初始化并能接收错误
- [ ] 埋点 tracker 已初始化
- [ ] Session Replay 已配置
- [ ] 第一份周报已生成

---

## 📂 产出物

```
.github/workflows/ci.yml               # CI/CD 流水线
telemetry/tracker.ts                   # 声明式埋点系统
src/plugins/sentry.ts                  # 错误追踪配置
docs/reports/weekly-[YYYY-WXX].md     # AI 自动周报
lighthouserc.json                      # 性能基准配置
```

---

## 🔄 闭环：周报 → 下一轮需求

AI 周报自动输出《MVP 优化建议文档》，作为 Skill-01 下一轮的输入：

```
📊 上线数据 → Skill-04 AI分析 → 优化建议文档 → Skill-01 新一轮需求 → ...
```
