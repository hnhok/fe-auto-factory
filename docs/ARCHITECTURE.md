# 🏗️ FE-Auto-Factory 架构详解

## 设计哲学

> **Schema 是唯一真相来源（Single Source of Truth）**
> 从需求分析到代码生成，再到测试和监控，所有阶段都以 Page Schema 为核心驱动。

---

## 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FE-Auto-Factory                              │
│                      前端自动化工厂体系                              │
└─────────────────────────────────────────────────────────────────────┘

        PRD文档                                        监控数据
           │                                              │
           ▼                                              ▼
   ┌──────────────┐                              ┌──────────────┐
   │  Skill-01    │◄─────── AI 周报闭环 ─────────│  Skill-04    │
   │  需求分析    │                              │  部署&闭环   │
   │  Schema驱动  │                              │  Sentry+埋点 │
   └──────┬───────┘                              └──────▲───────┘
          │ Page Schema YAML                            │ 部署
          ▼                                       ┌─────┴──────┐
   ┌──────────────┐      测试报告                 │  CI/CD     │
   │  Skill-02    │──────────────────►            │  Pipeline  │
   │  自动化开发  │                  │            └─────▲──────┘
   │  代码生成    │          ┌───────┴──────┐           │ 全绿
   └──────────────┘          │  Skill-03    │           │
          │                  │  自动化测试  │───────────┘
          │ 生成代码         │  E2E+性能   │
          └─────────────────►└──────────────┘
```

---

## 核心数据流

### 1. Schema → 多维资产 (v2.7+)

```yaml
# 输入：product-list.schema.yaml
page_id: ProductList
features: { pagination: true, search_bar: true }
models: { Product: { id: number, name: string } }
api_endpoints: [getProductList]
```

```text
factory generate ──►  src/views/ProductList/index.vue        (UI 布局)
                  ├── src/views/ProductList/hooks/use*.ts    (业务逻辑与特性封装)
                  ├── src/api/product-list.ts               (API 请求与类型注入)
                  ├── src/api/types/product-list.ts         (TS 接口定义)
                  ├── src/store/product-list.ts             (Pinia 状态管理)
                  ├── mock/product-list.mock.ts             (自动化 Mock 服务)
                  └── tests/e2e/product-list.spec.ts        (Playwright 测试)
```

### 2. 代码 → 测试

```
生成的 E2E 测试脚本  ──►  Playwright 执行  ──►  测试报告
生成的 Hook        ──►  Vitest 单元测试  ──►  覆盖率报告
生成的页面         ──►  Lighthouse CI   ──►  性能报告
```

### 3. 上线 → 闭环

```
生产环境 ──► Sentry 错误收集 ──► AI 分析 ──► 周报文档 ──► 下一轮 Skill-01
          └► 埋点数据采集 ──►/
          └► Lighthouse 趋势 ──►/
```

---

## 目录职责说明

| 目录 | 职责 | 被谁消费 |
|------|------|---------|
| `skills/01-requirements/` | 需求分析指南、PRD 模板 | 人类开发者 + Agent |
| `skills/02-development/` | 代码生成规范、最佳实践 | factory generate 命令 |
| `skills/03-testing/` | 测试策略、E2E 规范 | factory test 命令 |
| `skills/04-deployment/` | CI/CD 流程、监控配置 | GitHub Actions |
| `scripts/factory.js` | 主 CLI 微内核入口 (v2.10+) | 开发者命令行 |
| `scripts/commands/` | 独立命令模块 (v2.10+) | CLI 分发 |
| `scripts/generators/` | 多端适配器及引擎沙箱驱 | factory generate 命令 |
| `scripts/sdk/` | 第三方 NPM 插件使用的原子 SDK | Plugins |
| `scripts/utils/schema.js` | Schema 解析与 $ref 处理 | factory generate 命令 |
| `.factory/models/` | [v2.6] 全局共享数据模型池 | factory generate 命令 |
| `schemas/pages/` | 业务构架图纸库 (YAML) | 开发者核心资产 |
| `rules/fe-factory-rules.js` | 自定义 ESLint 规则 | 项目 eslint.config.js |
| `telemetry/tracker.ts` | 声明式埋点系统 | 项目 main.ts |
| `tests/playwright.config.ts` | E2E 测试配置 | Playwright |
| `tests/ci.yml` | CI/CD 流水线 | GitHub Actions |
| `.agent/workflows/` | Agent 标准化工作流 | AI Agent |

---

## Skill 调用链

```
开发者需求
    │
    ├─► 阅读 skills/01-requirements/SKILL.md
    │       └─► 创建 PRD Markdown + Page Schema
    │
    ├─► 运行 factory generate --schema <schema>
    │       └─► 调用 skills/02-development/SKILL.md 规范
    │           └─► 生成 Vue + Hook + API + Store + Test
    │
    ├─► 填写 TODO 业务逻辑
    │
    ├─► 运行 factory validate
    │       └─► ESLint(rules/) + TypeCheck + Schema校验
    │
    ├─► git push → CI Pipeline (tests/ci.yml)
    │       └─► 调用 skills/03-testing/SKILL.md 规范
    │           └─► Unit + E2E + Visual + Lighthouse
    │
    └─► 自动部署 → 监控启动
            └─► 调用 skills/04-deployment/SKILL.md 规范
                └─► Sentry + Tracker + AI周报 → 闭环
```

---

## 关键设计决策

### 1. 为什么选择 YAML Schema 而非代码配置？
- **可读性**：产品经理也能理解和填写
- **工具友好**：可被 AI 解析和校验
- **版本追踪**：Schema 变更可以 git diff

### 2. 为什么不用完整的 OpenAPI codegen？
- **渐进增强**：`factory sync --swagger` 可以增量引入
- **团队适配**：不强依赖后端提供规范文档
- **快速启动**：MVP 阶段优先跑通，再精细化

### 3. 为什么 E2E 由 Schema 自动生成？
- **降低心理负担**：开发者不需要"从零写测试"
- **保证覆盖**：每个页面的核心路径自动有测试
- **减少遗漏**：基于 User Story 生成，而非凭感觉

### 4. 为什么用声明式埋点而非手动埋点？
- **零侵入**：业务代码不需要 import 埋点 SDK
- **规范统一**：track-id 命名在 Schema 中预定义
- **防遗漏**：ESLint 规则检查 `require-data-track-id`
