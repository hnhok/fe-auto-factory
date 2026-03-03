# 架构组件 - CLI 微内核引擎 (fe-factory)

本套脚手架以 NodeJS 的 CLI 架构为基础，支持完全解耦的**微内核命令式生命周期和插件化**运作。

## `inquirer.js` 交互式入口

抛弃记忆高复杂度的 Shell 参数指令！引擎默认提供一键 GUI 选择器，通过：

```bash
npx fe-factory
```

即可调起菜单，供团队所有（包括新手前端）使用。

它囊括了如下子功能：
* **生成新页面（Schema Generator）** -> `scripts/commands/generate.js`
* **初始化新项目（Init Bootstrap）** -> `scripts/commands/init.js`
* **同步 Swagger 接口（OpenAPI Sync）**
* **自动进行质量检查（Validate & Lint）**

所有的分支由 `scripts/factory.js` 仅作转发和基础信息校验，实际业务逻辑高度自治于各自模块，这极大提升了扩展此工具的二次开发效率。
