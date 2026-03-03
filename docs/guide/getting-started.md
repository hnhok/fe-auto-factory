# 快速上手实战：初始化与工厂接入

无论你正在新建一套大型系统，还是在改造历史资产包，FE-Auto-Factory 都能以极低的成本无缝介入。本节展示了不同团队背景下的工业化落地方案。

---

## 场景一：拔地而起（创建全新的中后台/H5 站点）

当你被要求“从 0 出发开发业务系统”时，这套工具能提供自带的保姆级、无绑定重度侵入的标准基座。

### 第一步：召唤工厂，选择模板血统
在你的工作区内运行：

```bash
npx fe-factory
```

工厂的主控制台会弹出一个 GUI 向导。
或者你可以带上项目名直接执行初始化指令：

```bash
npx fe-factory init my-awesome-app
```

> 🎯 **云端镜像隔离架构**：
> 这里提供的预设模板，绝不是陈旧硬编码在 NPM 里的残破骨架，而是实时拉取官方/私有远端 Git 仓库的代码。这意味着你可以实时获得最先进的高手级配置的 Webpack/Vite 依赖库优化版本，并在初始化那一秒为你切断 Git 链，提供纯净的一手本地分支！而且你的这些项目会自带一份 `.factory/config.json` 身份牌文件，用来锁定你的技术栈适配器 (Adapter Preset)。

### 第二步：启动开发服务器
只需要常规操作：
```bash
cd my-awesome-app
npm install
npm run dev
```
此时你的开发环境和周边 CI/CD、Prettier 代码底座已然完成，你可以正式开始用 YAML 去设计页面结构与调用命令：

```bash
npx fe-factory generate --schema schemas/pages/UserList.yaml
```

---

## 场景二：旧貌换新颜（已有老项目的智能化植入）

如果你希望自己已上线一两年的 Vue 3 老项目也能一秒生成 API / UI 骨架并注入路由，而不用破坏已有的老代码，你只需执行两步：

### 第一步：引入 NPM 开发环境引擎
在你的项目根目录下：
```bash
npm install @hnhok/fe-auto-factory@latest -D
```

### 第二步：创建脚手架控制中枢
由于你是老项目，并没有走 `init` 命令的初始化操作。你需要在项目根目录下创建一个特殊的隐藏目录，充当我们引擎生成架构接手你的司令部：

1. 创建 `.factory` 文件夹
2. 在里面放入 `config.json`，并标记自己的架构血统：
```json
{
  "projectName": "your-legacy-app",
  "preset": "vue3-element-admin", 
  "schema": {
    "pagesDir": "schemas/pages"
  }
}
```

> ⚙️ **preset 血统**：由于你未开发自己独立的驱动插件，建议根据你老项目用的 UI 库，填写如内置的 `vue3-vant-h5` 或 `vue3-element-admin` 或自定义你公司的独立私有插件名（[具体参考后续章节对于 Plugin 开发的要求](/architecture/plugin-development.html)）。

接下来直接就可以利用工厂来解放双手的复制粘贴了：
```bash
npx fe-factory
```

## 下一步

准备好你的 Schema 结构图。点击侧边栏的 **[YAML 骨架规范]**，正式开始你的 “Schema 驱动开发之旅”！
