# 变更日志 (CHANGELOG)

## [v3.6.2] - 2026-03-05
### 体验优化 (Experience)
* **应用项目 UI 入口感知优化**: 
  - 在所有内置模板（Vue3 Admin / H5 等）的 `package.json` 中预设了 `factory:ui` 脚本，开发者只需运行 `npm run factory:ui` 即可快速开启可视化面板。
  - 同步补充了 `factory:generate` 和 `factory:report` 等常用快捷指令。
* **文档强化**: 在《5 分钟速通实战》教程中新增了专有的 Web UI 引导章节（步骤 4），大幅降低了新手的入门门槛。

## [v3.6.1] - 2026-03-05
### 体验优化 (Experience)
* **工业级命令行反馈 (CLI Spinner)**: 在 `init`、`generate`、`vision` 和 `report` 等核心耗时任务中全面引入了轻量级 Spinner 状态反馈动画。
* **状态感知增强**: 明确了 Schema 校验、驱动加载、资产拷贝及 AI 解析等关键节点的视觉反馈，消除了由于长时间无响应带来的“工具假死”错觉。
* **微调报告渲染逻辑**: 优化了 `report` 命令在不同项目环境下的兼容性。

## [v3.6.0] - 2026-03-05
### 新功能 (Features)

#### 💻 智能可视化引擎 (Visual Engine)
* **Web UI 控制台 (`fe-factory ui`)**: 全新推出运行在本地的独立可视化管理面板，彻底打破传统依赖终端命令行的“黑盒开发”体验。
* **一键可视生成**: 在 UI 控制台中支持直观阅览本地 Schema 图纸内容，并支持一键通过网页按钮触发底层的 AST 增量生成。
* **全息路由与组件拓扑网**: 
  * 引入服务端全新的 `api/routes` 和 `api/components` 端点。
  * `route-registry.js` 基于 AST (`ts-morph`) 实现了路由语法的静默解析。
  * 可视化面板通过内置 Tree 结构，实时动态描绘“全局组件”、“页面级组件”和项目的多层级嵌套“路由网络拓扑”。

#### 📈 数据化反哺 (Data Feedback)
* **智能代码健康度报告 (`report` 命令升级)**: 周报生成不再是单纯的静态模板输出，现在其能深度结合主工程内的运行环境：
  * **ESLint 静态分析拦截**：底层自动拉起 `npx eslint` 返回 JSON Ast 进行容错统计，准确反映当前项目的硬性代码异味：`Errors` 与 `Warnings`。
  * **TypeScript 强类型护城河**：自动兼容拉起基于所在项目的 `tsc` / `vue-tsc --noEmit`，暴露类型健康度！
  * 完美实现了「资产在本地跑，周报看真实」的极高工程价值。

## [v3.5.0] - 2026-03-05
### 体验优化与模板增强 (Experience & Template Enhancement)

#### 📖 文档体验优化
* **重构:** 全面重新梳理了文档中的《5 分钟速通实战》，将执行完 INIT 之后的连贯运行及新增的 AI 视觉一键生码 (`vision`) 流程无缝串联，消除了新手的割裂感。

#### 🔧 Admin 模板多环境增强
* **功能:** 为 `vue3-element-admin` 和 `react-antd-admin` 加入开箱即用的多环境配置。
* **新增:** `templates/base-vue3-element-admin/` 下新增 `.env.development`, `.env.test`, `.env.production`，支持本地/测试/线上环境区分。
* **重构:** `src/utils/request.ts` 新接入原生的 `import.meta.env.VITE_APP_ENV` 判断机制，支持 Axios Server API 的多环境智能动态切换。
* **脚本:** 新增 `build:test` 与 `build:prod` 构建指令。

#### 🐛 问题修复 (Bug Fixes)
* **交互层:** 彻底迁移 `inquirer` 旧版 `list` 到最新的 `select` 类型，修复了在 CLI 交互过程（如 `npx fe-factory init`）中终端预设列表无法显示的严重交互 Bug。

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
