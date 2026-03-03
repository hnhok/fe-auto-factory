---
name: code-review
description: >
  专项 Skill 07：AI 辅助代码规范审查。在 PR 开启或 pre-commit 阶段，
  对工厂生成以及开发者手写的代码执行规范性、安全性和一致性检查，
  输出具体可执行的修改建议，阻断不合规代码进入主干。
triggers:
  - "开启 Pull Request 时"
  - "执行 npx fe-factory validate 命令时"
  - "pre-commit hook 阶段"
  - "AI Agent 完成代码生成后自查阶段"
---

# 🔍 Skill 07 —  AI 代码规范审查 (Code Review)

## 目标
建立**零容忍代码规范体系**。不仅仅依靠 ESLint 这样静态分析工具，还通过工厂的自定义规则引擎
（`rules/fe-factory-rules.js`）以及 AI 代码审查能力，对生成代码和人工代码实施双重把关。

## 前提条件
- 项目已安装 `eslint`，且根目录存在 `.eslintrc.js` 或 `eslint.config.js`
- `rules/fe-factory-rules.js` 已作为自定义插件加载进 ESLint 配置

## 涉及工具链
- `scripts/validator.js` — 工厂验证器（结合 Ajv + 自定义规则）
- `rules/fe-factory-rules.js` — 自定义 ESLint 规则集（如有）
- `.husky/pre-commit` — 提交前钩子自动触发

---

## 步骤一：工厂器自定义规则清单

以下是工厂体系内强制要求的代码规范（所有规则优先级高于普通 ESLint：

| 规则 ID | 说明 | 是否可 Auto-fix | 违规严重级别 |
|--------|-----|---------------|------------|
| `fe/require-data-track-id` | 所有可交互元素（按钮、链接）必须有 `data-track-id` 属性 | ❌ 需手填 | **error** |
| `fe/no-inline-style` | 禁止在模板中写 `style="..."` 行内样式 | ✅ 自动提取 class | **error** |
| `fe/no-magic-api-url` | 禁止在 API Service 外硬编码 URL 字符串 | ✅ 提取为常量 | **error** |
| `fe/no-direct-store-mutation` | 禁止在组件内直接修改 Pinia store，必须调用 action | ✅ | **error** |
| `fe/require-loading-state` | 含有 `await` 的函数，必须有配套 `loading` 状态管理 | ❌ | **warn** |
| `fe/require-error-boundary` | 页面级别组件（`src/views/**`）必须有 `v-if="error"` 分支 | ❌ | **warn** |
| `fe/factory-slot-integrity` | `[FACTORY-HOOK-CUSTOM-START]` 注释必须成对出现 | ✅ | **error** |

---

## 步骤二：执行代码审查命令

```bash
# 全量工厂规则校验（包含 Schema 格式 + 代码规范）
npx fe-factory validate

# 只运行 ESLint（含自定义规则），并自动 fix
npm run lint -- --fix

# 检查特定文件
npx eslint src/views/OrderList/index.vue

# 查看所有自定义工厂规则
npx eslint --list-rules | grep "fe/"
```

---

## 步骤三：AI 代码审查检查清单

在执行代码审查时，AI Agent 需要按以下清单对改动文件逐项检查：

### 3.1 命名规范
- [ ] Vue 组件文件名：`PascalCase.vue`
- [ ] Composable 文件名：`use[PageId].ts`，导出函数也同名
- [ ] API Service 变量名：`camelCase`，如 `getOrderList`
- [ ] CSS class：必须使用 `kebab-case`，不使用 `_` 下划线

### 3.2 Vue 组件规范
- [ ] `defineProps` 带有完整 TypeScript 类型（不允许 `any`）
- [ ] 不在 `<template>` 里写逻辑表达式（超过 2 个三元嵌套必须抽出）
- [ ] `v-for` 必须带有 `:key`，且 key 不使用 index（使用唯一业务 ID）
- [ ] 不在 `<style scoped>` 内使用 `!important`

### 3.3 异步状态处理
- [ ] 所有 API 调用必须用 `try/catch` 包裹
- [ ] `catch` 块不允许空捕获（必须至少有 `console.error` 或用户反馈）
- [ ] loading/error 状态在请求发起前设置，在 `finally` 中重置

### 3.4 埋点合规
- [ ] 所有 `@click`、`@submit`、 `@change` 的关键元素具有 `data-track-id`
- [ ] `data-track-id` 的命名格式：`{PageId}-{Element}-{Action}`（如 `OrderList-Btn-Search`）
- [ ] track ID 与 Schema 的 `track` 字段保持一致

---

## 步骤四：Pre-commit Hook 配置标准

在项目根目录的 `.husky/pre-commit` 中应包含以下顺序：

```bash
#!/bin/sh
# 1. 格式化（自动修复）
npx lint-staged

# 2. 工厂规则审查
node scripts/validator.js

# 3. TypeScript 类型检查
npx tsc --noEmit
```

`lint-staged` 配置（`package.json`）：
```json
{
  "lint-staged": {
    "src/**/*.{vue,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## ✅ 阶段完成标志

- [ ] `npx fe-factory validate` 无错误输出
- [ ] `npm run lint` 无 error 级别告警  
- [ ] 所有可交互 UI 元素带有 `data-track-id`
- [ ] 所有 API 调用带有 loading/error 处理
- [ ] Pre-commit hook 通过

## 📂 产出物

```
（本 Skill 无实体文件产出，输出为代码质量改进结果）
```
