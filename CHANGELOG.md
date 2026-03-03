# 变更日志 (CHANGELOG)

## [v3.4.0] - 2026-03-03
### 新功能 (Features)

#### 🏗️ 视觉快照沉淀与复用系统 (Vision Snapshot Store)
* **新增文件:** `scripts/snapshot/store.js` — 快照持久化存储引擎，支持写入/读取/删除/图片 MD5 精确匹配。
* **新增文件:** `scripts/snapshot/matcher.js` — 基于 Jaccard 算法的语义相似度匹配，权重组合：组件 50% + API 30% + Features 20%。
* **改造:** `scripts/vision.js` — 识别前三重过滤（精确命中 → 语义匹配 → 全新识别），识别后自动入库，支持 `--force`/`--note` 参数。
* **新增命令:**
  - `npx fe-factory vision <image> [--force] [--note "..."]` — 带快照预检的图片识别
  - `npx fe-factory vision snapshot list` — 列举历史快照
  - `npx fe-factory vision snapshot delete <id>` — 删除快照

#### ♻️ 全项目组件复用检测 (Component Registry)
* **新增文件:** `scripts/snapshot/component-registry.js` — 递归扫描 `src/components/**` 和 `src/views/*/components/**`，构建组件注册表。
* **改造:** `scripts/generators/base.js::generateComponentScaffolds` — 生成前过滤已有组件，仅对真正新增的组件生成骨架，已有组件返回复用 importPath 供上层注入。
* **改造:** `driver-vue3-vant-h5.js`、`driver-vue3-element-admin.js` — 组件注册表结果在视图渲染前注入 `enrichedParams`。

#### 📚 Skills 体系扩展
* **新增:** `skills/05-component-reuse/SKILL.md` — 组件复用策略规范
* **新增:** `skills/06-vision-snapshot/SKILL.md` — 视觉快照积累与复用规范
* **新增:** `skills/07-code-review/SKILL.md` — AI 代码规范审查清单（含 8 条工厂规则 + Vue 规范 + 埋点合规）
* **新增:** `skills/08-performance/SKILL.md` — 性能基准与 Lighthouse CI 规范（含 SLA 指标表）
* **新增:** `skills/INDEX.md` — Skills 总览调度索引（含 AI Agent 关键词匹配规则）
* **改造:** 所有现有 Skills（01~04）补充标准化 `triggers`/`preconditions`/`toolchain` 字段

#### 🤖 Agent 工作流升级
* **升级:** `.agent/workflows/img2code.md` — 新增阶段 0「快照库预检」，阶段 2「快照入库」，接入组件复用提示
* **升级:** `.agent/workflows/generate-page.md` — 新增步骤 3「组件复用预检」
* **新增:** `.agent/workflows/snapshot-manage.md` — 快照库管理工作流（列举/搜索/删除/跨页复用）

#### 🛡️ ESLint 规则增强
* **新增规则:** `rules/fe-factory-rules.js::factory-slot-integrity` — 检测 `[FACTORY-HOOK-CUSTOM-START/END]` 注释必须成对存在，防止增量合并时丢失手写代码

### SDK 导出扩展
* `@hnhok/fe-auto-factory/sdk` 新增导出：`saveSnapshot`、`listSnapshots`、`findByImageHash`、`findByKeyword`、`deleteSnapshot`、`findSimilarSnapshots`、`findBestMatch`


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
