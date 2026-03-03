# 变更日志 (CHANGELOG)

## [v3.3.0] - 2026-03-03
### 架构重构 (Architecture Refactoring)
* **核心 (Core):** `scripts/factory.js` 现已彻底拆分为模块化的微内核命令式架构 (`scripts/commands/` 目录)。
  - `generate.js`: 从中心剥离，支持 NPM Plugin 生命周期的动态加载 (`onGenerate`, `beforeGenerate`, `afterGenerate`)。
  - `init.js`, `validate.js`, `test.js`: 命令控制流从原先的 God Object 抽离。
* **引擎隔离 (Engine Isolation):** 引入工业级 `ejs` 模板渲染引擎。
  - 原先内置在 `driver` 文件里的冗长 `content = ...` 字符串模板已被彻底删除，改为独立的 `templates/vue3-vant/view.vue.ejs` 与 `hook.ts.ejs` 资产。
  - 真正实现了业务逻辑 (Driver Code) 与资产模板 (Assets) 的冷热隔离。

## [v3.2.0] - 2026-03-02
### 功能增强 (Features)
* 增加了对 `npm` 微内核驱动插件架构接口 `exports: { "./sdk": "./scripts/sdk/index.js" }` 的向外暴漏基础设施。

## [v3.1.0] - 2026-03-01
### 功能增强 (Features)
* 支持了根据 Swagger 接口直接反向工程出页面 YAML Schema。

## [v3.0.0] - 2026-02-28
### 功能增强 (Features)
* AST 智能插拔更新：在热更新 Hook 和 TypeScript 文件时，保护用户的 `[FACTORY-HOOK-CUSTOM-START]` 逻辑槽位不变。
