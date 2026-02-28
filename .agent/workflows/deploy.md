---
description: 生产部署与上线反馈闭环（CI 通过后部署 + 监控初始化 + 周报生成）
---

# 工作流：生产部署 & 反馈闭环

## 前置条件
- CI/CD 全量测试通过
- 服务器 SSH 配置已完成（在 GitHub Secrets 中配置）
- Sentry DSN 已配置

## 步骤

### 1. 确认 CI 流水线全绿

检查 GitHub Actions 页面，确认以下所有 Job 通过：
- ✅ 质量守卫 (quality-gate)
- ✅ 单元测试 (unit-tests)
- ✅ E2E 测试 (e2e-tests)
- ✅ 性能基准 (lighthouse)

### 2. 配置环境变量

确认 `.env.production` 包含：
```
VITE_API_BASE_URL=https://api.your-domain.com
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_TRACK_ENDPOINT=https://api.your-domain.com/track
VITE_RELEASE_VERSION=
```

### 3. 初始化 Sentry 错误追踪

在 `src/main.ts` 中确认已引入 Sentry 插件：
```typescript
import { initSentry } from './plugins/sentry'
initSentry(app)
```

### 4. 验证埋点系统

在 `src/main.ts` 中确认已初始化 tracker：
```typescript
import { tracker } from '../fe-auto-factory/telemetry/tracker'
tracker.init()
```

### 5. 触发部署（push 到 main 分支）

```powershell
git add .
git commit -m "feat: deploy MVP v1.0"
git push origin main
```

CI 将自动执行完整流水线并部署。

### 6. 验证线上部署

访问生产 URL，验证：
- [ ] 页面正常加载（FCP < 2s）
- [ ] Sentry 收到测试错误（手动触发一次）
- [ ] 埋点事件正常上报（点击带 data-track-id 的按钮后查看 Network）

### 7. 生成首次周报（部署后1周）

```powershell
node ../fe-auto-factory/scripts/factory.js report --week
```

查看 `docs/reports/weekly-YYYY-WXX.md`，将优化建议作为下一轮迭代需求。

## 🔄 闭环机制

```
上线 → Sentry监控 → AI周报生成 → 优化建议文档 → Skill-01新需求 → ...
```

## 完成标志
- 生产环境页面正常访问
- Sentry 面板可收到错误事件
- 埋点数据正常流入数据看板
- 首份周报已生成
