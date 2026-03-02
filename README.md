# 🏭 FE-Auto-Factory — 前端自动化工厂

> 基于 Vue 3 + Vite + Vant 技术栈，通过 Skill 体系实现从需求→开发→测试→上线的全生命周期标准化自动化。

---

## 🗺️ 体系架构

```
fe-auto-factory/
├── skills/                    # Skill 知识库（四大阶段）
│   ├── 01-requirements/       # 阶段1: 需求分析 & Schema驱动设计
│   ├── 02-development/        # 阶段2: 自动化开发 & 代码生成
│   ├── 03-testing/            # 阶段3: 自动化测试 & 质量守卫
│   └── 04-deployment/         # 阶段4: 上线反馈 & 闭环
├── templates/                 # 代码生成模板
│   ├── page/                  # 页面模板
│   ├── component/             # 组件模板
│   ├── service/               # API Service 模板
│   └── store/                 # Pinia Store 模板
├── scripts/                   # 工厂 CLI 脚本
│   ├── factory.js             # 主 CLI 入口 (v2.7)
│   ├── generators/            # 驱动适配器 (Vant/Element/React)
│   │   ├── base.js            # 通用生成基类
│   │   └── driver-*.js        # 多端适配逻辑
│   └── utils/                 # Schema & 字符串解析工具
├── schemas/                   # JSON Schema 核心规范
│   ├── page.schema.json       # 页面元数据强校验 (Ajv)
│   └── pages/                 # 业务构架图纸库 (YAML)
├── rules/                     # 自定义 ESLint 规则
│   └── fe-factory-rules.js    # 工厂最佳实践规则集
├── tests/                     # 测试自动化基础设施
│   ├── playwright.config.ts   # E2E 测试配置
│   ├── fixtures/              # 测试夹具
│   └── e2e/                   # E2E 测试脚本
├── telemetry/                 # 遥测 & 埋点
│   └── tracker.ts             # 声明式埋点系统
├── .agent/workflows/          # Agent 工作流
│   ├── init-project.md        # 初始化工作流
│   ├── generate-page.md       # 页面生成工作流
│   ├── run-tests.md           # 测试执行工作流
│   └── deploy.md              # 部署工作流
└── docs/
    ├── ARCHITECTURE.md        # 架构详解
    ├── SKILL-GUIDE.md         # Skill 使用指南
    └── CHANGELOG.md           # 变更日志
```

---

## 🚀 快速开始

### 1. 初始化新项目
```bash
npx fe-factory init my-project
```

### 2. 环境诊断与自愈 (v2.6+)
```bash
npx fe-factory doctor
```

### 3. 从 Schema 生成页面 (v2.7+)
```bash
npx fe-factory generate --schema schemas/pages/ProductList.yaml
```

### 4. 从设计稿 AI 视觉生成页面
```bash
npx fe-factory vision
```

### 5. 基建同步更新
```bash
npx fe-factory update
```

### 6. 执行质量检查与测试
```bash
npx fe-factory validate
npx fe-factory test
```

---

## 📖 四大 Skill 阶段

| 阶段 | Skill 目录 | 核心产出 |
|------|-----------|---------|
| 📋 需求分析 | `skills/01-requirements/` | Page Schema YAML、PRD 模板、组件清单 |
| 🔧 自动化开发 | `skills/02-development/` | 代码生成、API绑定、状态管理、自动修正 |
| 🧪 自动化测试 | `skills/03-testing/` | E2E脚本、视觉回归、性能基准 |
| 🚀 部署&闭环 | `skills/04-deployment/` | CI/CD流水线、埋点分析、错误追踪 |

---

## 🛠️ 技术栈

- **框架**: Vue 3 + TypeScript
- **构建**: Vite 6
- **UI库**: Vant 4 (H5)
- **状态**: Pinia
- **路由**: Vue Router 4
- **样式**: Less + UnoCSS
- **代码质量**: ESLint + Prettier + Husky
- **测试**: Playwright + Vitest
- **CI/CD**: GitHub Actions
