# 高级特性：EJS 模板隔离与 AST 无损引擎

过去的低端代码生成器有一个致命痛点：生成一次后，如果在生成的组件/逻辑里手动写点业务，然后再触发一下生成，手写代码全废，等于覆盖。

`FE-Auto-Factory` 是如何越过这一雷池？这里我们深度剖析我们的 `EJS 资产物理隔离` 和 `AST 热插拔缝合` 技术（引入了重装 Node 的 Typescript API 抽象语法树：`ts-morph`）。

## 1. 原则：UI 业务归业务、核心归核心 (EJS)

从 `v3.3.0` 起，你再也看不到驱动 `driver` 里乱糟糟的庞大硬核模板拼接（比如那些反直觉的 `content = '<template>...<script>'` 字符串字面量逻辑了）。所有的视图生成（比如 Vant 的 `view.vue.ejs` 或者是 React 体系的 `.tsx.ejs`）都被独立剥离存活在了 `templates/` 系统与沙箱目录下！

你可以甚至不用看晦涩的生成器源码，仅仅是在你的项目或者 npm 插件源码里的 `.ejs` 文件增加一个 `div` 或全局的样式，它就即刻会在接管时同步输出！业务定制再也不用深入内核驱动。

## 2. 路由安全映射注入 (Router AST Mutation)

一个好的前端工程必然不应该去用 `A.replace` 或者 `split(',')` 去暴力插入路由项。我们怎么做的？

**全链路 AST 节点注入 (`base.updateRouterSafely`)**：
1. `ts-morph` 将你项目下纯正的 TypeScript 源文件（如 `src/router/index.ts`）在内存虚拟环境中构建出一棵 DOM 版抽象语法树。
2. 内部进行深度优先遍历 (`DFS`) 寻找你声明了 `const routes = [...]`，或者是寻找了 Vue Router 初始化时调用的 `createRouter({ routes: [...] })` 的根节点。
3. 如果未检测到本需要挂载的 `path`，它会新构建一个 AST 对象节点。对于 `Vue-Router`，它聪明地判断要采用动态引用组件的方式加载你的页面：
   ```typescript
   export const routes = [
     // ...现有手写业务项目保持不动,
     // 新增一个：
     {
       path: '/user-management',
       name: 'UserManagement',
       component: () => import('@/views/UserManagement/index.vue'),
       meta: { title: '客户管理后台大盘' }
     }
   ]
   ```
4. 利用库原生的打印机制和底层的 Prettier `eslint format`，把这段完美包含缩进的新树无损替换硬盘里的 TS 文件。杜绝因为漏逗号、闭环不严谨导致整个前端编译崩塌。

## 3. 热插拔特性与无损留存（Incremental Patching v3）

怎么解决覆盖问题？利用特定槽位机制和 AST，引擎会在更新前，提前把用户写入的增量保护起来：

### State 响应式槽位的增补
在 React Hooks 或 Vue `setup` 里的 `const state = reactive({ ... })` 这个闭包外壳中，引擎检查 `state` 树中当前有哪些 `prop` 是属于开发者后期增加的。引擎在追加了 YAML Schema 里的新项后，仅将被剥除老 `prop` 打包缝回去，绝不会覆压业务私存或自定义 UI 交互字段。

### 保护业务逻辑大块的 Custom Slot
当你生成了 `useUserManagement.ts` 或 `views/index.vue` 之后，在 `return { ... }` 或者是指定的代码块（我们会在生成处附带 `// [FACTORY-HOOK-CUSTOM-START]` 锚位提示）：

- 当你在更新 `Schema.yaml`（比如加上几个新 API）并重新执行 `generate` 命令时，驱动不仅不会蛮横覆盖整个 Hook 或组件，而是首先进入**吸纳阶段 (Absorb)**。
- 引擎会通过正则表达式或者内存 `ts-morph`，把这两个锚位包围的用户手工代码完整地**切片储在内存池中**。
- 等待工厂生成了新的完整的框架和 `EJS` 树之后，把那坨旧逻辑**回填原装灌入 (Inject)** 新框架指定的锚位！
- 最终经过统一格式化格式（`eslint/prettier`）存盘。

由此实现了 `AI 代码全托底 + 人工微调干预留存`的闭环。
