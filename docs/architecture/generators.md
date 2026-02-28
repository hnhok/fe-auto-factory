# 脚手架注入原理解构 (Generators)

## 字符串注入还是 AST 解析？

`fe-auto-factory` `v2.0` 中的模板输出默认采用了快速且容易理解的字符串动态拼接（JS Template Literals）及 EJS 等组合型手段进行直接输出。

为了保持极低的理解门槛，我们目前在初始构建页面的第一步并未默认拉起极重（如通过 `Babel`/`jscodeshift` 的 Parser 分析阶段）。不过这是未来进行无损增加与修复代码必走的演进之路。

## Vue-Router 动态织入技术

当我们进行 `fe-factory generate` 添加新功能页面的时候。并不满足于干巴巴地“生成一些 Vue 文件”。
此架构会在 Node 生命周期中执行一个极为隐蔽且高效的挂载动作 `updateRouter()`：它会运用正则等手段跨文件对你的根路由 `index.ts` 进行热点修改。直接暴露其 Route Entry。让跑在 CLI 层的东西无缝对接进 Browser 视图。
