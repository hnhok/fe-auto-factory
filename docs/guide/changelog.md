# 迭代更新日志 (Changelog)

这里记录着每一次核心基建工厂 `fe-auto-factory` 发布的功能节点，你可以在你的下游业务控制台中利用 `npx fe-factory update` 来同步最新的基建能力！

## [v2.9.0] - 2026-03-02
- ✨ 新增: **增量更新与安全插槽 (Smart Patching)**。通过标记注释 `<!-- [FACTORY-CUSTOM-START] -->` 与 `// [FACTORY-SCRIPT-START]` 实现对开发者自定义代码块的保留。再次生成页面时不再暴戾覆盖已有逻辑！
- 🔧 优化: `ast.js` 扩展 `extractSection` 提取引擎，为多种文件、多种语言的语法提供通用插槽提取方案。

## [v2.8.0] - 2026-03-02
- ✨ 新增: **智能化 Mock 引擎 (Smart Mocking)**。不再只是机械地填入 `@ctitle`，生成器能够根据字段名（如 `avatar`、`email`、`phone`、`price` 等）嗅探出其业务语义，并生成带真实质感的模拟数据结构，极大地提高了 UI 还原真实度。
- 🔧 修复: Mock 文件生成时由于引号闭合导致的类型验证异常，确保生成 TypeScript 的第一性安全。

## [v2.7.0] - 2026-03-02
- ✨ 新增: **功能感知渲染 (Feature-Aware Scaffolding)**。Schema 支持 `features` 字段，一键开启 `pagination` (分页/无限滚动)、`pull_to_refresh` (下拉刷新)、`search_bar` (搜索栏) 等标准业务模式。
- ✨ 新增: **状态驱动建模 (State Integration)**。Schema 支持 `state` 字段定义页面级响应式变量，自动同步至 Pinia Store 和 Vue Hook。
- 🚀 增强: **AST 核心基建大修**。重构 `ast.js` 注入引擎，路由注入与埋点同步更加稳健。
- 🔧 优化: 模型隔离机制，页面私有模型与全局共享池物理分离，确保生成代码的纯净度。

## [v2.6.0] - 2026-03-02
- ✨ 新增: **核心自愈系统 (Architectural Doctor)**。新增 `factory doctor` 命令，自动诊断 Node 版本、核心依赖、路径别名等环境风险并修复。
- ✨ 新增: **全局模型池 (Global Model Pool)**。支持在 `.factory/models/` 定义共享模型，通过 `$ref: ModelName` 实现跨页面复用。
- 🚀 增强: 采用 `js-yaml` 作为底层解析引擎，支持更复杂的嵌套对象和 YAML 高级语法。
- 📦 升级: 默认支持 `vue3-element-admin` 和 `vue3-vant-h5` 的深度建模能力。

## [v2.5.0] - 2026-03-01
- ✨ 新增: **领域驱动建模 (Models & Types)**。支持在 Schema 中定义 `models`，自动生成 TypeScript 接口定义 (`src/api/types/*.ts`)。
- ✨ 新增: **自动化 Mock 镜像 (Mock Generation)**。基于模型定义自动生成 Mock 服务数据，实现前后端并行开发。
- 🚀 增强: API 与 Store 文件的类型化。自动根据模型推导请求函数返回值和 Store 状态类型。

## [v2.4.0] - 2026-02-28
- ✨ 新增: **原子化组件脚手架 (Atomic Scaffolding)**。支持在生成页面时自动识别并生成 `components/*.vue` 业务组件骨架，区分 UI 库组件与业务组件。
- ✨ 新增: **自动化埋点资产同步 (Tracking Sync)**。通过 AST 技术自动将 Schema 中的 `track` ID 同步至项目的 `constants/tracking.ts` 枚举中。
- 🚀 增强: 引入 `fe-factory report` 命令，支持生成基于代码产出与测试结果的 AI 周报文档。

## [v2.3.0] - 2026-02-27
- ✨ 新增: **驱动沙箱系统 (Driver Sandbox)**。支持在项目 `.factory/drivers/` 目录下自定义渲染驱动，实现对中央引擎生成逻辑的无损扩展。
- ✨ 新增: 核心逻辑拆分为 `base.js` 基类与各端适配器，极大提升了多端驱动（Vue/React）的维护效率。
- 🔧 优化: 增强了 `init` 命令的预设选型逻辑，支持在项目中烙印“血统指纹”。
- 🚀 增强: 集成了 `eslint` 与 `type-check` 校验流，确保生成代码的第一时间合规性。

## [v2.2.1]
- 🚀 重构: 彻底解耦包体积！`init` 指令的执行方式由本地文件复制跃升为**云端模板动态浅克隆 (Git Shallow Clone)**。支持在拉取后自动安全剥离 `.git` 历史。

## [v2.2.0]
- ✨ 新增: **[重磅]** 工业级多框架适配器架构上线！`init` 后不再硬性绑定 Vue3+Vant，支持弹出式架构选型菜单（包含 Element Plus, React+Antd 等）。
- ✨ 新增: `vision.js` 看图生代码引擎现在具备动态上下文感知能力！AI 会根据你当前工程的框架血统，为你生成包含特定组件（如 `ElTable` 而不是 `VanList`）的独家 Schema 图纸。

## [v2.1.1]
- ✨ 新增: 业务端在 `init` 初始或执行 `update` 操作后，脚手架的引擎版本和更新情况将自动落盘至业务项目的 `docs/CHANGELOG.md` 中。所有基建下放动作都有清晰日志迹检可查阅。

## [v2.1.0]
- ✨ 新增: 支持了 `npx fe-factory update` 在下游项目中直连并热更新主工程最前沿的规则。
- ✨ 新增: 初始化新项目时默认携带 `.agent` 配置文件，新业务落地即刻拥有 IDE 原生支持的 `/img2code` 纯图像生代码工作流接入能力。

## [v2.0.2]
- 🔧 修复: Github Packages 下发逻辑参数及 npm 缓存同步问题。

## [v2.0.1]
- 📝 文档: 补齐关于如何在全公司开启统一的 `@hnhok` github 私库配置指引。

## [v2.0.0]
- 🚀 重构: 大跨步跨越！由原本手动执行转变为 `inquirer` 傻瓜化 GUI 面板。可以不背任何命令行选项了。
- 🛡️ 安全: 接入 `Ajv` 强级拦截。再也不怕团队新人手滑把 YAML 的 Layout、路由少写错写。发现必阻断。

## [v1.0.0]
- 🎉 破壳: Schema 驱动工厂的第一代核心逻辑面世。拥有 `generate`, `sync`, 等强悍核心！
