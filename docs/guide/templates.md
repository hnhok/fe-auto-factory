# 🧱 官方核心模板矩阵 (Templates)

`FE-Auto-Factory` 之所以强大，不仅仅在于它的代码拼接引擎，更在于我们官方持续维护的、经过千万级 UV 验证的底层开源架构模板。

在执行 `init` 时，如果你不使用你们公司的自定义 NPM 驱动，引擎将为你呈现以下三大旗舰基座。它们都是独立的远端 Git 仓库，初始化时自动以 `Shallow Clone` 模式挂载到你的本地并剥离 Git 关联。

## 1. 📱 H5 移动级触屏架构 (`vue3-vant-h5`)

这是我们在处理微信生态或内嵌 App Hybrid 页面时首选的开箱即用矩阵。

- **核心栈**: Vue 3 (Composition API) + Vite + Vant 4 + Pinia
- **设计特色**:
  - 深度集成了 `UnoCSS` 极致原子化引擎，解决移动端样式臃肿。
  - 内置了经过无数次迭代的 `Axios` 全局响应拦截器（无感知 Token 刷新、全局 Loading 接管、401 跳登录等）。
  - `PostCSS-px-to-viewport` 自适应体系：设计稿直接以 `375` 基准量测，代码也是直书 `px`，真机完美缩放！
  - 完美适配前端工程化 `husky + lint-staged`。

## 2. 💻 PC 中后台管线大厦 (`vue3-element-admin`)

专为 B 端复杂的检索、分页、表单管理流设计的 Admin 框架。如果你要开发内部管理台，这是目前的「版本答案」。

- **核心栈**: Vue 3 + Vite + Element Plus + Vue Router 4
- **设计特色**:
  - 开箱即用的「动态路由导航」和「侧边权限菜单」打通机制。一旦在工厂利用 Schema 生成新页面并配置 `layout: default`，它就会全自动向你的左侧菜单注入。
  - 标准化的大型数据表格封装（结合我们生成的 `useXXX` Hooks，你连分页逻辑和 Loading 都不需要写）。
  - 多页签缓存 (`Keep-Alive` Tags View) 机制底层集成。
  - 轻量灵动，不包含臃肿无用的“几十种三方插件拼凑”，只留给你最干净的开发骨架。

## 3. ⚛️ 前沿纯血中控平台 (`react-antd-admin`)

为了适应部分强类型与 Immutable 数据流拥护团队的需求，我们平行演进了这条 React 大本营分支。

- **核心栈**: React 18+ (Hooks) + Vite + Ant Design 5.x + Zustand / Redux Toolkit
- **设计特色**:
  - 全量拥抱大厂级别的 TypeScript 严苛规范，所有 Factory 引擎在 React 模式下生成的接口 Model 均带有 `interface` 推导。
  - 抛弃繁重的 Redux 样板代码，默认集成轻量级的响应性极佳的 `Zustand` 状态仓库。
  - 利用 `Ant Design` 强大的 `ProComponents` 思想，极少数代码完成重型全功能表单增删。

---

## 为什么要强调“云端隔离模板”？

传统的脚手架工具习惯于把所有的原始模板文件（如 `package.json`、`main.ts`）压缩进一个巨大的 npm 工具包中，每次执行 `create` 的时候去解压。这造成了极大的**腐化**。

而在我们的架构里，哪怕是不升级 `FE-Auto-Factory` 的核心 CLI，只要团队的模板负责人向这些独立的开源（或企业内源）Git 仓库推送了最新的包版本或 Vite 调优，所有的开发者下一次运行 `init` 获取到的都是**最新鲜的技术源泉**！
