# 多端渲染矩阵与生成引擎 (Generators)

`fe-auto-factory` `v2.3+` 采用了基于 **Adapter Pattern (适配器模式)** 的多端分发架构。它不仅支持多种前端框架，还通过云端动态拉取实现了模板与核心引擎的物理隔离。

## 1. 模板注册中心 (Registry)

所有的官方及私有模板都注册在 `scripts/factory.js` 的 `TEMPLATE_REPOS` 字典中。当执行 `init` 命令时，引擎会根据用户的选择从远端 Git 仓库执行 **浅克隆 (Shallow Clone)**：

```javascript
// factory.js 内部映射
const TEMPLATE_REPOS = {
  'vue3-vant-h5': 'https://github.com/hnhok/vue3-vant-h5.git',
  'vue3-element-admin': 'https://github.com/hnhok/vue3-element-admin.git',
  'react-antd-admin': 'https://github.com/hnhok/react-antd-admin.git'
}
```

## 2. 渲染驱动架构 (Driver System)

引擎根据项目根目录 `.factory/config.json` 中的 `preset` 字段，动态加载对应的 **渲染驱动 (Driver)**。

- **动态加载逻辑**：`import(`./generators/driver-${preset}.js`)`
- **驱动职责**：驱动文件（如 `driver-vue-element.js`）只需负责 UI 层（`.vue` / `.tsx` 文件及对应的 `Hooks`）的特定模板渲染。
- **通用能力下沉**：所有的基础 CRUD 逻辑（API 定义生成、Pinia/Redux Store 生成、E2E 测试脚本生成）均封装在 `generators/base.js` 中，供各驱动调用，保持了核心逻辑的 **DRY (Don't Repeat Yourself)**。

## 3. 进阶注入：AST 抽象语法树解析 (v2.3+ 核心)

为了保证源码操作的绝对安全性，我们废弃了脆弱的“正则/字符串替换”模式，引入了 **`ts-morph`** 进行工业级的 AST 操作。

### 路由安全注入 (Router Mutation)

当生成新页面时，`base.updateRouterSafely` 会启动 AST 引擎：
1. **解析**：读取业务工程的 `src/router/index.ts` 并构建内存语法树。
2. **定位**：精准识别 `createRouter` 的配置对象或 `const routes = [...]` 数组声明。
3. **注入**：在语法层面插入新的路由对象节点，而不是简单的文本追加。
4. **格式化**：自动保持代码缩进与逗号规范，杜绝因手工代码格式不规范导致的生成的代码“编译报错”。

## 4. 如何接入一个新模板？

如果你想为团队定制一个新的架构模板（例如：`vue3-arco-design`）：

1. **准备仓库**：创建一个独立的 Git 仓库，放置标准的骨架代码。
2. **注册地址**：在 `factory.js` 的 `TEMPLATE_REPOS` 中添加键值对。
3. **编写驱动**：在 `scripts/generators/` 下新建 `driver-vue3-arco.js`，参考已有的 Vant 驱动实现 `generatePage` 接口即可。
4. **全自动闭环**：此后，所有开发者在 `init` 时即可选到该模板，且 `generate` 命令会自动识别并产出适配该 UI 库的代码。
