# 进阶定制：架构适配器与模板接入

从 `v2.3` 版本开始，`fe-auto-factory` 已经实现了完全的 **架构中立**。你可以根据团队的技术栈，轻松接入自定义的脚手架模板与渲染驱动。

## 1. 架构选型配置 (`.factory/config.json`)

每个由工厂生成的项目，根目录下都会包含一个 `.factory/config.json` 文件。它定义了该项目的“血统”：

```json
{
  "projectName": "my-admin-app",
  "preset": "vue3-element-admin"
}
```

- **preset**: 决定了执行 `generate` 命令时，工厂会调起哪一个渲染驱动进行代码拼装。

## 2. 编写与接入渲染驱动插件 (Driver Plugin)

渲染驱动决定了 Schema 如何转化为具体的 `.vue` 或 `.tsx` 视图资产组合。

从 `v3.3.0` 抛弃了硬编码后，你拥有极度自由的驱动编写路径：

1. **同构私有插件**：在当前根目录创建 `.factory/drivers/driver-[你的preset名字].js`
2. **NPM 插件包分发**：以 `@your-corp/fe-factory-plugin-[preset]` 发布到私有镜像。

只要提供下面的一致性入口即可触发：

## 3. 利用 SDK 原子能拼装大模型

对于插件包编写：我们向外抛出了 `scripts/sdk/index.js`，包含强大的基础 AST 合并算法，避免你从头去写重复的代码分析生成：

```javascript
import { generateApiFile, updateRouterSafely } from '@hnhok/fe-auto-factory/sdk'

export default {
    name: 'custom-driver-react',
    templatesDir: './your/package/templates', // 放置你的 EJS 核心
    async onGenerate(params) {
      const { page_id, api_endpoints, kebab } = params
      const cwd = process.cwd()

      // 1. 可以结合 EJS 渲染 UI 代码
      // ...

      // 2. 调用 SDK Base 自动落盘 API/Store/Test 等
      await generateApiFile({ cwd, ...params })
      
      // 3. 调用 AST 安全增补到主路由
      await updateRouterSafely({ cwd, page_id, kebab })
    }
}
```

## 4. 路径复写 (`.factoryrc.json`)

如果你的项目结构比较特殊（例如 API 文件夹叫 `services`），你可以在项目根目录下创建 `.factoryrc.json` 进行路径覆盖：

```json
{
  "apiDir": "src/services",
  "viewsDir": "src/pages"
}
```
