# FE-Auto-Factory 项目演变与介绍

**FE-Auto-Factory** 是一套围绕 **Schema 驱动开发 (Schema Driven Development)** 和 **微内核 (Micro-Kernel)** 的现代化企业级前端工程化与自动化生成引擎。

## 🎯 我们的願景

让每一个前端研发团队抛弃“从别人的项目中疯狂复制粘贴骨架”的旧石器开发方式。
只需提供一份精确描述业务单元数据结构和能力的 **Page Schema 图纸**，剩下的目录结构、UI 布局、API 调用、Pinia 状态挂载、甚至 E2E 测试和单元测试脚本，全部由这套自动工厂引擎在几秒钟之内拔地而起！不仅如此，它还可以智能、无损地融合你的后续人工修改代码。

## 🚀 版本演进史

我们在长期的微前端、重前端业务挑战中不断摸索，演化出了如今强悍成熟的 `v3.3.0` 版本体系：

### v1.0：模板挂载纪元
最早的工厂模型。基于文件拷贝和简单的正则替换，完成了诸如 `Vue Router`、`Pinia` 目录在初始化过程中的搭建。
**痛点**：不支持局部更新，每次生成意味着文件覆盖。业务同学不敢在生成的组件中写手写逻辑，限制了其生命力。

### v2.0：AST 智能缝合纪元
为了彻底解决“生成即覆盖”的难题，我们毅然引入了基于重型 TypeScript `Compiler API` 封装的 `ts-morph` 进行 AST (抽象语法树)级别的页面缝补：
- 当用户手动增加一个 `fetchCustomData()` 到生成的 Hook 里时，下一次用 Schema 重新生成并不会删除它。
- `base.updateRouterSafely` 等安全注入机制，实现了类似 `git merge` 的工业级无损合并算法。
- 不再阻断人工补丁代码，实现了人机协作（AI & Developer）的双打结对编程。

### v3.0：微内核与 NPM Plugin 纪元 (The Turning Point)
我们发现单一的内置驱动无法适配各种公司风格各异的中后台与 H5 技术栈（比如有些人爱 ArcoDesign，有些人非 ElementPlus 不可）。于是从 `v3.0.0` 开始：
- **剥离 CLI 与业务器**：`scripts/factory.js` 现已彻底改造成一个 CLI 流量路由中心。真正的调度由独立的 `commands/*` 管理。
- **模板与驱动双物理隔离**：所有的前端 UI 生成均被剥离到了标准的 `ejs` 引擎体系下。
- **NPM Package 生态扩展**：支持业务线按需开发属于自己的 NPM Plugin 架构适配包 (`@your-company/fe-factory-plugin-[preset]`)，只需要向引擎暴漏 `onGenerate` 生命周期和提供对应的 `templatesDir` 资产即可完成无缝内嵌。
- **SDK 发布**：底层的 AST 增量合并等复杂运算被提取到了统一的 `@hnhok/fe-auto-factory/sdk` 供所有第三方插件直调。
