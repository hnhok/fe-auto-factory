# 微内核架构解析 (Micro-Kernel Architecture)

本规范描述了 FE-Auto-Factory (自 `v2.10.1` 版本起) 所采用的开放式/可插拔内核模型。

## 目录与物理组织
* **内核入口**: `scripts/factory.js` 
  - 职责: CLI 命令行分发、全局参数解析 (Schema loading、Ajv Validators)。不包含执行细节。
* **命令路由层**: `scripts/commands/`
  - 职责: 具体承载指令下发的独立 Node 模块。例如 `generate.js`, `init.js`。
* **驱动运行沙箱**: `scripts/generators/`
  - 职责: 对于某个技术栈场景 (如 `vue3-vant-h5`) 核心的生成生命周期定义。它是一套适配器，用于决定如何使用数据调度 EJS 和 AST 工具链。
* **视图资产层**: `templates/`
  - 职责: 纯粹的骨架片段 (.vue.ejs, .ts.ejs)，允许用户无需排查庞大逻辑驱动便可修改 UI 视图和交互基础盘。
* **工具原子堆**: `scripts/sdk/` 结合 `scripts/generators/utils/ast.js`
  - 职责: 提供诸如热替换、向路由挂载、无损注入节点之类的操作工具，为第三方 npm 插件使用 SDK 暴露。

## 外部 NPM Plugin 生命协议规范
在上述分层设计中，第三方开发者发布 `@fe-factory/plugin-[tech-stack]` 将直接被工厂内部 `generate` 路由动态识别 `await import()` 并调度。

它必须暴漏符合以下格式的接口：
```javascript
export default {
    name: 'tech-stack',
    templatesDir: '指向你分发包自带的 ejs/ 结构',

    beforeGenerate(generateParams) { /* 可选 */ },
    
    async onGenerate(generateParams) {
        // [必须] 控制文件资产落地，包括生成视图，模型转换等
    },

    afterGenerate(generateParams) { /* 可选，常用于格式化等 */ }
}
```

## EJS 结合 AST 智能 Patching 理念
这套引擎并不简单覆盖文件以阻止开发者编辑生成的应用槽位。

在任何模板或 `ejs` 渲染时，我们会提供：
- `// [FACTORY-CUSTOM-START]` ...等锚位。开发者写进去的代码块，在下次 schema 被运行变更 (比如数据 API 更新) 时，内核会用正则或 `ts-morph` AST 首先把这些 "旧槽位代码" 收拢在内存里。
- 后续利用 ejs 注入 `customUI` 的参数将其回写到最新框架里。达到业务隔离不断代的能力。
