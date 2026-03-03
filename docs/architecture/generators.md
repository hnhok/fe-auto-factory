# 多端渲染矩阵与生成引擎 (Generators)

`fe-auto-factory`自 `v3.3.0` 起，升级为 **Micro-Kernel (微内核)** 与 **npm Plugin** 星状解耦架构。不再采用硬编码架构与预发驱动挂载，而是通过可动态 import 的插件机制进行端能力的分发。

## 1. 模板资产的物理隔离 (EJS 体系)

过去的版本中，驱动代码里充斥着海量的字符串模板拼接（如 `content = '<template>...'`）。在当前架构中，这部分职责已被剥离到 `templates/` 目录：

- **分离原则**：驱动仅仅是核心控制器，负责通过 AST 读取或解析 Schema，将其转换为数据模型。
- **UI 资产交接**：引擎通过 `ejs` 工具链，将参数合并到 `templates/vue3-vant/view.vue.ejs` 等资产文件中，用户甚至可以直接去项目里修改 `ejs` 骨架而不必理会复杂的底层 AST 源码。

## 2. 渲染驱动架构 (Micro-kernel Driver System)

引擎根据前端项目根目录 `.factory/config.json` 或 `.factoryrc.json` 中的 `preset` 字段，动态按优先级尝试加载 **渲染沙箱插件 (Driver Plugin)**：

1. **本地私有沙箱**：优先尝试加载项目级别的 `[ProjectRoot]/.factory/drivers/driver-[preset].js`。
2. **NPM 独立插件**：尝试 `await import('@fe-factory/plugin-[preset]')`。这允许社区随意分发独立的框架驱动！
3. **内置缺省回退**：退回工厂内置的 `scripts/generators/driver-[preset].js`。

驱动插件需要导出包含 `name`, `templatesDir` 以及 `onGenerate` 生命周期核心方法的对象。基础能力（如 API / Store / 单元测试 / E2E等生成基底）仍然通过 SDK 提供复用。

## 3. 进阶注入：AST 抽象语法树解析 (v2.3+ 核心)

为了保证源码操作的绝对安全性，我们废弃了脆弱的“正则/字符串替换”模式，引入了 **`ts-morph`** 进行工业级的 AST 操作。

### 路由安全注入 (Router Mutation)

当生成新页面时，`base.updateRouterSafely` 会启动 AST 引擎：
1. **解析**：读取业务工程的 `src/router/index.ts` 并构建内存语法树。
2. **定位**：精准识别 `createRouter` 的配置对象或 `const routes = [...]` 数组声明。
3. **注入**：在语法层面插入新的路由对象节点，而不是简单的文本追加。
4. **格式化**：自动保持代码缩进与逗号规范，杜绝因手工代码格式不规范导致的生成的代码“编译报错”。

### 增量热插拔与合并 (Smart Patching v3.0.0+)

这是区分传统代码生成器的核心里程碑。我们解决了“二次生成覆盖手写逻辑”的业界难题：
1. **State 响应式增量**：精准查找到 `const state = reactive({ ... })` 这个包裹区域，只把 Schema 缺少的 `prop` 挂载进去，保证已有的自定义状态不出错。
2. **方法与变量比对**：遍历 Hook 内部代码，如果工厂自动生成出的新 `fetchData` 或其他行为函数在旧代码中还未定义，就会自动平滑缝合进主 Hook 内。
3. **安全导出 (Return)**：最终会自动合并 `return { ... }` 中的导出句柄，确保增补的功能函数正确暴露给 UI 层，完全不干扰开发者的已有逻辑。

## 4. 如何接入一个全新架构库？

如果你想为团队定制一个新的架构模板（例如：`vue3-arco-design`）：

1. **准备模板资产仓库**：创建一个独立的模板骨架工程托管在远端。
2. **编写 NPM 驱动插件**：
   你可以自己新建一个包 `@your-corp/fe-factory-plugin-arco`。
3. **调用官方核心 SDK**：
   在驱动插件里，直接 `import { updateRouterSafely, ... } from '@hnhok/fe-auto-factory/sdk'` 来获取增量抽象语法树的能力。
4. **暴漏标准生命周期**：
   写好 `onGenerate` 逻辑，并将 `ejs` 控制权指向你插件包里的 `templatesDir`。
5. **在项目中使用**：在老项目或新项目中修改 `.factory/config.json` 的 `preset: "@your-corp/fe-factory-plugin-arco"`。引擎将全自动接管生成！
