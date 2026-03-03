# 历史版本与迭代更新日志 (Changelog)

这篇日志为您记载了 FE-Auto-Factory 逐步从一个弱不禁风的模板拷贝工具，到掌握底层 AST 解析引擎控制，再化身为去中心化、企业级自动化生成方案的完整历程。

---

## [v3.x.x] - 微内核与插件化化解耦宇宙 (Current)

这一代是我们对传统生成器认知的**颠覆点**。引擎变成了纯粹的标准控制中心，不再捆绑并写死各个公司特异的技术体系：

### v3.4.0 - (2026-03-03) 🆕

#### 🏗️ 视觉快照沉淀与复用系统
- 识别图片前先查快照库（MD5 精确命中 → 0 Token；Jaccard 相似度 ≥ 45% → 合并差量）
- 识别结果自动持久化到 `.factory/snapshots/`，供团队复用
- 新增命令：`vision snapshot list`、`vision snapshot delete`

#### ♻️ 全项目组件复用检测
- `generate` 时扫描 `src/components/**` 和 `src/views/*/components/**`
- 已存在组件：返回正确 `importPath`，跳过文件生成；全新组件：正常生成骨架

#### 🛡️ 代码规范增强
- 新增 ESLint 规则 `factory-slot-integrity`：确保 `[FACTORY-HOOK-CUSTOM-START/END]` 成对出现
- 组件白名单外部化至 `schemas/component-whitelist.json`（支持多框架：vant/element-plus/antd）

#### 🔧 工程化改进
- 版本号统一从 `package.json` 读取，结构化退出码（`2/3/4`），`DEBUG=fe-factory:*` 调试模式
- `features` Schema 开放自定义布尔 Feature Flag（`additionalProperties: boolean`）
- 快照格式版本控制（`_version`）+ 旧快照自动迁移

#### 📚 Skills 体系 & Workflow
- 新增 Skills 05~08（组件复用、视觉快照、代码审查、性能规范）+ `INDEX.md`
- `/img2code` 工作流升级（快照预检 + 自动入库），新增 `/snapshot-manage` 工作流

### v3.3.0 - (2026-03-03)

* **核心 (Core):** `scripts/factory.js` 现已彻底拆分为模块化的微内核命令式架构 (`scripts/commands/` 目录)。
  - `generate.js`: 从中心剥离，支持 NPM Plugin 生命周期的动态加载 (`onGenerate`, `beforeGenerate`, `afterGenerate`)。
  - `init.js`, `validate.js`, `test.js`: 命令控制流从原先的 God Object 抽离。
* **引擎隔离 (Engine Isolation):** 引入工业级 `ejs` 模板渲染引擎。
  - 原先内置在 `driver` 文件里的冗长 `content = ...` 字符串模板已被彻底删除，改为独立的 `templates/vue3-vant/view.vue.ejs` 与 `hook.ts.ejs` 资产。
  - 真正实现了业务逻辑 (Driver Code) 与资产模板 (Assets) 的冷热隔离。

### v3.2.0 - (2026-03-02)
### 功能增强 (Features)
* 增加了对外部扩展友好的 `npm` 微内核驱动插件架构接口 `exports: { "./sdk": "./scripts/sdk/index.js" }` 向公众曝光安全基础设施。

### v3.1.0 - (2026-03-01)
### 功能增强 (Features)
* 支持了根据后端 Swagger 文档 (OpenAPI) 直接跨域抓取，并反推生成页面 YAML Schema 的强劲 `sync` 同步能力！

### v3.0.0 - (2026-02-28)
### 重大更新 (BREAKING CHANGES)
* **AST 智能热插拔增量缝合**上线！
  - 彻底解决了生成的钩子或者视图如果遭遇二次 Schema 覆盖执行就会报销的死穴！保护用户的 `[FACTORY-HOOK-CUSTOM-START]` 逻辑槽位与新增 State 状态在重新编译下也能完全存留。
* GUI 可视化编辑器 `fe-factory ui` 原型落成，开启向 Low-Code 的迈进。

---

## [v2.x.x] - 标准化、能力收敛与生态聚合时代

该时期确立了“所有底层能力向架构和插件流向流转”的初步设计，并补全了 `E2E/API/Mocking` 等自动化体系骨架体系。

### v2.10.x - (2026-02-xx)
* **驱动生命周期暴露 (`hooks`)**: 新增 `beforeGenerate` & `afterGenerate` 来规范自动化生成格式化 (`Prettier` 等)。
* **Smart Mocking Engine**: 原生内嵌了无脑且严谨的智能假数据分析并打通接口的数据流拦截。

### v2.7.0 ~ v2.9.0 - (2026-02-xx)
* 引进“特征感知脚手架 (`Feature-Aware Scaffolding`)”。当你的 Schema 打破 `pagination` 开关时，自动输出全部有关分页的声明。
* **全局模型流转池 (`Global Model Pool`)**: 在 `.factory/models/` 增加了所有页面的复用定义，根绝各种 interface 的同名碎片和重复编码 (`$ref` 注入)。

### v2.4.0 ~ v2.6.0 - (2026-02-xx)
* 引入了初级的 **AST (ts-morph)**，抛弃了容易错乱的正则替换。
* 添加了 **Driver Sandbox (适配器沙盒)**。奠定了后续多端插件系统 (`Vant`/`Element` 特化) 的分离。
* 实现了 `Atomic Component` 生成机制与**页面级别诊断工具 (`Factory Doctor`)**。

### v2.0.0 ~ v2.3.0 - (2026-02-xx)
* 正式化远程 **Git 同构多端模板挂载机制**（`Remote Multi-terminal Templates`）。利用 `Git Clone` 彻底解耦模板派发与 CLI 版本之间的捆绑强关联。
* 系统补齐了针对开发流 `skills/` 流水线系统的分段监控并实现了智能更新回写的架构基建平台 (`.agent/`)。
* 引入多模态大模型**基于图像 (img2code IDE Prompt)** 的第一代视觉解析架构。
* 完成项目正式开源与并打包上架发布于 GitHub Registry 流水线（`npm packages` 指引）。
