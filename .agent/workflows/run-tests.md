---
description: 运行全量自动化测试套件（单元测试 + E2E + 视觉回归 + 性能基准）
---

# 工作流：自动化测试执行

## 前置条件
- 项目已初始化且依赖已安装
- 基准视觉快照已建立（首次运行需用 `--update-snapshots` 建立基准）

## 步骤

### 1. 安装测试工具依赖

```powershell
npm install -D vitest @playwright/test
npx playwright install chromium
```

### 2. 运行单元测试

```powershell
npx vitest run --reporter=verbose
```

确认覆盖率 ≥ 80%。

### 3. 构建并启动预览服务

// turbo
```powershell
npm run build
```

// turbo
```powershell
npx serve -s dist -l 4173
```

### 4. 运行 E2E 测试

```powershell
npx playwright test --config=../fe-auto-factory/tests/playwright.config.ts
```

### 5. 查看测试报告

```powershell
npx playwright show-report tests/playwright-report
```

### 6. 视觉回归测试（可选）

首次建立基准：
```powershell
npx playwright test --update-snapshots --grep @visual
```

后续对比：
```powershell
npx playwright test --grep @visual
```

### 7. 使用工厂命令一键运行全量测试

```powershell
node ../fe-auto-factory/scripts/factory.js test --all
```

## 完成标志
- 单元测试 100% 通过，覆盖率 ≥ 80%
- E2E 测试全部通过
- 无视觉回归差异（或差异 < 1%）
- Lighthouse FCP < 2s, TBT < 300ms
