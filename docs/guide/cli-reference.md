# FE-Auto-Factory 命令参考速查表 (CLI Reference)

本章节收录了通过 `npx fe-factory` 直接驱动引擎的所有可用命令及参数。你可以随时按需查询。

---

## 全局唤醒 (Interactive UI)

```bash
npx fe-factory
```
- **功能**：如果不带任何后缀命令，直接唤起 GUI 模式的交互式控制台菜单。提供全套从 0 到 1 的生成向导（包括选模板、选图纸）。这是新人最推荐的方式。

---

## 1. 🏗️ 初始化架构基座

```bash
npx fe-factory init [project-name]
```
- **功能**：从官方云端矩阵（或你们公司的预设中）拉取隔离架构分支。
- **依赖**：网络，需访问内部 Git / Github。
- **输出**：在当前执行目录下创建 `project-name` 目录，配置依赖，打上 `.factory/config.json` 血统烙印。 

---

## 2. ⚡ Schema 图纸执行生成渲染

```bash
npx fe-factory generate --schema <path_to_yaml>
```
- **必备参数**：
  - `--schema` 或 `-s`：指向你需要生成的页面描述文件（支持绝对与相对路径，一般例如 `schemas/pages/UserList.schema.yaml`）。
- **流程与行为**：
  1. 通过 Ajv 校验指定的 YAML 格式。
  2. 获取 `.factory/config.json` 的 `preset`。
  3. 执行 **驱动渲染**和 **AST 无损增量合并** 到你的已有业务文件。 
  4. 为你注入路由和输出自动化测试代码。
- **注意**：哪怕该文件已经生成过，重新运行也是安全的（它绝不覆盖带有 `[FACTORY-HOOK-CUSTOM-START]` 包覆范围内的手写代码及追加导出的状态）。

---

## 3. 🔄 Swagger 接口反向同步推导

```bash
npx fe-factory sync --swagger <api_docs_url> [--extract <module_name>]
```
- **功能**：不用手敲 YAML，让工厂引擎前往你们后端的接口主页（遵循 OpenAPI 3.0 / 2.0 规范的 JSON 源链），为你生成对应的数据字典。
- **可选参数**：
  - `--extract <module>`：如果你的接口服务上有数百个分类，通过这个参数直接指定特定的业务分类名称（如 `Auth`，`OrderCenter` 等），引擎不仅截取模型，同时直接为您直接构建出一套 **立等可用的页面 Schema 草图** 到 `schemas/pages/` 目录下。

---

## 4. 👁️ 图像识别建站 (Vision Agent)

```bash
npx fe-factory vision
```
- **功能**：唤起视觉工作流，将提供的一张页面 UI 设计稿或草图截图，逆向推导出一份包含了布局分析、字段识别的 FE-Auto-Factory 规范 YAML 图纸。
- **注意**：引擎底层的图像感知接入由公司的底层通用配置下发，生成过程可能需要十来秒。（结合 `.agent/workflows/img2code.md` IDE 指令，能在比如 Cursor 中以对聊的形式触发自动化流程。）

---

## 5. 🏥 环境与健康检查 (Doctor / Validate)

### `doctor` 指令
```bash
npx fe-factory doctor
```
- **功能**：扫描当前所在的工程，验证它是不是一个能被我们引擎顺滑接管的项目。
- **检查项**：
  1. 是否存在 `.factory/config.json` 及 `preset` 定义。
  2. `tsconfig.json` 对于 `@/` alias 的配置正确与否（直接关系到 AST 插入路由能否成功）。
  3. 检查有没有安装了必须的包生态。

### `validate` & `test` 指令
```bash
npx fe-factory validate
npx fe-factory test
```
- **功能 (`validate`)**：自动基于工厂系统生成的 `fe-factory-rules.js` 调用项目的 ESLint 引擎对所有被你手写过的代码，重新进行全盘风格梳理与格式化修复。检查有无遗漏 `[data-track-id]` 埋点等定制架构规范。
- **功能 (`test`)**：触发由工厂之前在生成时带给你的 Playwright E2E 或 Vitest 并行测试，用机器拦截掉生产故障。

---

## 6. ⬆️ 跟进架构最新版体系

```bash
npx fe-factory update
```
- **功能**：工厂底层或者驱动有巨大的优化？业务无需重做。在工程里直接敲这个，我们将自动拉取您使用的 NPM `preset` 最新架构及基础依赖定义，甚至为您在本地生成本次拉平带来的 `CHANGELOG.md` 流水，保证版本知识不断代。

---

*（说明：这些命令的入参、逻辑实现，完全封装在我们内核的独立沙箱 `scripts/commands/` 下。并且工厂也提供 NPM 包向外引用的核心编程宏 API 比如 `@hnhok/fe-auto-factory/sdk`，如果您在写第三方 CLI 插件的话也是完全共享的）*
