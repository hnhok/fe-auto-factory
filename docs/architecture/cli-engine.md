# 架构组件 - CLI 核心引擎 (fe-factory)

本套脚手架以 NodeJS 的 CLI 架构为基础，支持插件化运作。

## `inquirer.js` 交互式入口

抛弃记忆高复杂度的 Shell 参数指令！引擎默认提供一键 GUI 选择器，通过：

```bash
npx fe-factory
```

即可调起菜单，供团队所有（包括新手前端）使用。

它囊括了如下子功能：
* **生成新页面（Schema Generator）**
* **初始化新项目（Init Bootstrap）**
* **同步 Swagger 接口（OpenAPI Sync）**
* **自动进行质量检查（Validate & Lint）**

你能够非常简单的对基础源文件 `factory.js` 添加其他交互式 case。
