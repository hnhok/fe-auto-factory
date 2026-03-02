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

## 2. 接入自定义模板项目 (Remote Repo)

如果你需要接入团队内部的私有模板：

1. **托管仓库**：将你的脚手架骨架（包含完整的 Vite/Webpack 配置、基础 `App.vue`、`router` 结构等）托管至 Git。
2. **注册模板**：在工厂源码的 `scripts/factory.js` 中，找到 `TEMPLATE_REPOS` 变量，添加你的映射：
   ```javascript
   const TEMPLATE_REPOS = {
     'my-custom-framework': 'https://github.com/your-org/my-template.git'
   }
   ```
3. **完成介入**：此后执行 `init` 时，菜单中将出现你的自定义选项，引擎会自动处理 Clone 与 Git 剥离。

## 3. 编写渲染驱动 (Driver)

渲染驱动决定了 Schema 如何转化为具体的 `.vue` 或 `.tsx` 文件。

1. 在 `scripts/generators/` 下新建 `driver-my-custom-framework.js`。
2. 实现 `generatePage` 导出函数。
3. **推荐做法**：继承并复用 `base.js` 中的通用能力。

```javascript
import * as base from './base.js'

export async function generatePage(params) {
  const { page_id, title, layout, api_endpoints, camel, kebab } = params
  const cwd = process.cwd()
  const config = base.getFactoryConfig(cwd)

  // 1. 编写你特有的 UI 渲染逻辑
  // ...写入文件...

  // 2. 调用 Base 自动完成 API/Store/Test 的生成
  base.generateApiFile({ cwd, config, page_id, api_endpoints, kebab })
  
  // 3. 调用 AST 辅助工具安全注入路由
  await base.updateRouterSafely({ cwd, page_id, kebab })
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
