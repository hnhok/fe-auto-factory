# 微内核全景大盘 (Micro-Kernel Architecture)

本规范描述了 `FE-Auto-Factory` (`v3.3.0`+) 独创的星状前端基建模型机制，该机制彻底终结了“God Object”或“巨石 CLI 工具难以适应各种业务线框架”的问题。

> **我们倡导：分离核心逻辑控制流，赋予 UI 生成逻辑无上的插件自由度！**

## 1. 体系与物理组织架构

`FE-Auto-Factory` 将其运行分为三个大圈层：命令行中心（路由器）、内核解析与 SDK 模块、驱动沙盒插件。

* **第一圈：命令行中枢与流量分发 (`scripts/factory.js`)**
  - 不做任何具体的视图拼接和 E2E 脚本的写入操作。
  - 接管 `npx fe-factory` 的互动式选择 (`Inquirer`) 或捕获终端参数 (`--schema xxxx.yaml`)。
  - 将接收到的请求转发到第二层的**命令逻辑网 (`scripts/commands/`)**

* **第二圈：命令逻辑层 (`scripts/commands/*.js`)**
  - 这里收敛着每种动作真正的业务逻辑。例如 `init.js` 调用远端拉取 Git 源码。`generate.js` 利用 `ajv` 解析你的 `yaml` 后动态寻找正确的渲染插件。
  - **核心 SDK 子集**: 内部高度包装化的 `scripts/sdk/` 暴露给下面的底层沙箱，提供 AST 热更新算法、安全写入文件流等。

* **第三圈：驱动沙盒模型与 EJS 隔离 (`npm plugin` 或 `drivers`)**
  - “当我们要渲染一份 React 后台和一份 Vue H5” 的分歧点所在。
  - 沙盒模型被赋予了如何拼接 EJS 模板库和业务变量的纯粹展示层职责，而无需操心 AST 和文件读写到底怎么锁线程和冲突解决。（[详细参阅下文的 EJS 隔离架构](./ejs-and-ast.html)）

---

## 2. 内核是如何找到插件驱动的？

当 `npx fe-factory generate --schema xxx` 被触发时，`commands/generate.js` 会通过读取你老工程（或新项目）里的 `.factory/config.json` 里 `preset: "vue3-vant-h5"` 字段启动一套**渐进式挂载流**：

1. 引擎首先**向下探索私有定制能力**：如果探测到了物理世界根目录下的 `[ProjectRoot]/.factory/drivers/driver-[preset].js`，就会优先通过 ES Module 的 `await import()` 加载项目级别开发者自己手写的挂载沙箱库。
2. 引擎接着**寻找外部 npm 生态插件**：比如你填的是 `@my-corp/react-antd-admin`，就会直接 `await import` 该包并执行插件中的 `onGenerate` 生命周期。这让工厂变成可以随意发布的平台化标准体系！
3. 若均无法找到：最后退避到系统出厂内置的缺省渲染函数（内置了 `element`/`vant` 等常见预设机制）。

## 3. SDK 标准接口透出 (`sdk/index.js`)

在最新的稳定版里，通过设置在 `package.json` 的 `exports: { "./sdk": "./scripts/sdk/index.js" }` 这个属性。
任何在公司内部编写的生成插件，都可以用最简单的导入就能执行 AST 安全合并！不再需要处理晦涩的 `ts-morph` 对象引用：

```javascript
import { 
  updateRouterSafely, 
  generateApiFile, 
  loadGlobalModels 
} from '@hnhok/fe-auto-factory/sdk'
```
