# 入门指南

欢迎使用企业级前端自动化工厂架构。我们将通过一个简单的 CLI 引擎，将你的 Schema（结构定义）自动化翻译成完整的业务功能闭环。能够做到：**统一团队代码风格库规范、屏蔽重复性的 API 绑定劳动、自动化注册路由表及状态**。

## 安装核心引擎

在现有的前端项目中（目前默认最佳支持 Vue3 系列），你可以直接把本项目当做构建器。

```bash
# 确保项目根目录存在 .npmrc，配置 @hnhok:registry=https://npm.pkg.github.com
# 并在终端使用 npm login 登录你的 GitHub Token，随后执行安装指令：
npm install @hnhok/fe-auto-factory@latest -D
```

*(注意：当前版本托管在 GitHub Packages 平台，依赖带有 `read:packages` 权限的 Personal Access Token 才能安装)*

## 初始化测试

如果您是一个“毫无架构资产”的新研发，想要快速开启一个企业级空项目并绑定到脚手架中，可以直接运行：

```bash
npx fe-factory
```
此时脚手架系统会弹出 GUI 命令行菜单，选择 **“📦 初始化新项目”**。

它会自动拷贝一整套完善的、配齐了 Vite / Vue-Router / Pinia / Vant 的标准工程化前端业务根目录。

## 通过 Schema 产出模板

新项目中默认创建好了 `.factory/config.json` 与 `schemas/pages/` 目录。
只需通过在 `schemas` 之下增加例如 `ProductOverview.schema.yaml` 规格文件。

写入规范配置信息（详见后面章节配置教程），然后再控制台中：

```bash
npx fe-factory
```
选择 **“🌟 生成新页面”**。
此时，`fe-auto-factory` 解析整个 YAML 内容，无缝自动帮你在业务里：
- `src/views/` 构建 View 单页面组件、导入 `Hooks` 和状态拦截器。
- `src/router/index.ts` 中无缝拼装该界面的跳转路径绑定。
- `src/api/` 生成占位或映射的后端真实接口模型。
- `tests/e2e` 中产生用于持续集成的 Web 界面端到端校验测试。

业务开发者的唯一任务，仅仅是在 `// TODO:` 跟 `<!-- CONTENT -->` 的预留注释口写入核心交互逻辑。

## 基建迭代与日志追溯

为了保证团队工程能随时享受到主架构的最新红利，我们在系统设计时引入了**基建热更新机制**。

当工厂主库（工厂包）存在更新后，业务开发者只需要两步：

1. 终端拉取最新版脚手架依赖： `npm install @hnhok/fe-auto-factory@latest -D`
2. 执行框架同步更新动作：在这台业务电脑上运行 `npx fe-factory` 然后选择菜单第二项对应的 **🔄 从远端同步基建升级 (Update)**（或者直接执行 `npx fe-factory update`）。

**更新日志落地**：
尤为关键的是，脚手架工具非常注重**演进透明度**。您每执行一次上述 `update`（以及您首次 `init` 初始项目的时刻），工厂包会自动在您当前业务工程的 `docs/CHANGELOG.md` 中追写对应的自动生成构建日志迹检。
这样以来，不论是跨职能的测试人员，还是业务侧接管的其他研发，都能在这份文件中详细考据你们何时进行了底层能力的同步动作。
