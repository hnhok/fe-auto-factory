# 扩展与定制 Hook

默认的架构中，`scripts/generator.js` 决定了 Vue Hook, Store, 甚至是 Template API 的渲染形式。

## 逃生舱配置 (`.factoryrc.json`)

我们提倡前端项目的工程团队应当自己持有对于底层生产资料（脚手架）的管理和复写权。通过下放配置至根目录下的 `.factoryrc.json` 中可以做到：

* **更改脚手架目标代码生成路径** (例如强行指向 `src/pages` 而并非官方自带的 `src/views`)
* **提供多套 Preset 模板系统** 如果你的业务采用的是 React / Element Plus 等，后续将开源支持加载本地模板引擎的功能。
