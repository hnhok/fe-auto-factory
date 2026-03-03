# 进阶定制：NPM 插件驱动开发规范

从 `v3.3.0` 开始，`fe-auto-factory` 微内核全面解耦，成为真正的 **架构中立引擎**。你可以根据团队的技术栈，轻松接入、发布和跨业务线流转独立的脚手架生成适配器（Driver Plugin）。

如果你想发布一套公司内部私有 NPM 包（比如 `@your-org/fe-factory-plugin-arco`）来自动接管团队对 ArcoDesign 中后台的要求，本指南将向您展示一切。

## 1. 启动一个独立 NPM 驱动包项目

您可以就地新建一个项目结构：

```
fe-factory-plugin-arco/
├── package.json
├── index.js                  # 插件生命周期入口
└── templates/
    ├── view.vue.ejs          # 视图骨架图 (EJS 隔离层)
    └── hook.ts.ejs
```

## 2. 编写生命周期入口 (index.js)

必须向外抛出一个含 `name`、`templatesDir` 与 `onGenerate` 的主要映射对象。

**注意：切勿自己去拼凑和读取底层繁琐的 ts-morph 写文件！我们向外透出了全局基础 SDK！**

```javascript
// npm install @hnhok/fe-auto-factory@latest 
// 利用我们官方分发的 SDK 提供的基础算法盘
import { 
  generateApiFile, 
  updateRouterSafely 
} from '@hnhok/fe-auto-factory/sdk'
import ejs from 'ejs'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// 或者获取你自带资产体系所在的文件夹物理路径
const myTemplatesDir = join(process.cwd(), 'node_modules/@your-org/fe-factory-plugin-arco/templates')

export default {
    name: 'marco-arco-driver',
    templatesDir: myTemplatesDir,

    // [可选] 生成前做一些环境探测准备等
    async beforeGenerate(generateParams) {
        console.log("准备接管 Arco 渲染工作流...")
    },
    
    // [必须] 控制文件资产落地，包括生成视图，模型转换等核心脉络！
    // 引擎传给你的 generateParams 包含了从 .yaml 图纸拔取的解析对象
    async onGenerate(generateParams) {
      const { page_id, api_endpoints, kebab } = generateParams
      const cwd = process.cwd()

      // ============================================
      // 1. 调用 EJS 处理你自定义特有的 UI 渲染与 Hook 生成落地
      // ============================================
      const viewCode = ejs.render(readFileSync(join(myTemplatesDir, 'view.vue.ejs'), 'utf-8'), generateParams)
      // 比如你判断你的视图该写向哪里：
      writeFileSync(join(cwd, 'src/views', page_id, 'index.vue'), viewCode)
      // ... 依葫芦画瓢生成 hook ..

      // ============================================
      // 2. 调用官方 Base SDK 自动复刻统一的落盘基建工作
      // ============================================
      // (为你输出 API Service / TS Types 强推导 / Store 库及 e2e 测试脚本)
      await generateApiFile({ cwd, ...generateParams })
      
      // ============================================
      // 3. 调用官方 AST 辅助工具，安全无损增补项目的主路由入口
      // ============================================
      await updateRouterSafely({ cwd, page_id, kebab })
    },

    // [可选] 格式化等收尾挂载
    async afterGenerate(generateParams) {
       console.log("Arco 驱动完成渲染作业！")
    }
}
```

## 3. 在消费端如何使用

1. 你可以通过 `npm publish` 将它推向内部私仓（你也可以只是将 `index.js` 放在某项目的 `.factory/drivers/driver-arco.js` 作为独占使用）。
2. 在新/旧项目中执行 `npm install @your-org/fe-factory-plugin-arco -D`。
3. 修改项目的 `.factory/config.json` 里 `preset: "@your-org/fe-factory-plugin-arco"`。

此后所有执行 `npx fe-factory generate` 命令所衍生的前端大厦均出自您的架构师之手。
