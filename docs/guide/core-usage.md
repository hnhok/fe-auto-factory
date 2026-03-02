# 🛠️ 开发实战指南：用魔法生产业务

当你完成上一节的“接入”工作，手握 `npx fe-factory` 指令时，真正的魔力才刚开始流淌。
请永远牢记：**这套工具并不是纯命令行生成代码的占位符那么简单，它是一套从需求侧到代码侧的心智映射系统**。

---

## 🔮 魔法 1：设计稿直出代码 (AI VLM 强强联合)

这个功能将会颠覆你的传统“写样式卡盒子”的开发习惯：
工厂内部内置了一套强大的 IDE 打通协议（包含提示词 `Agent`），你可以让具有视觉理解能力的大模型代你写下那套烦人的结构骨架。

### 场景体验
当 PM 扔给你一张画好的业务原型时：

1. 打开这个项目所在目录的 VSCode、Cursor 或是 Antigravity 插件。
2. 在侧边栏的 AI 聊天窗口里，直接 **上传你要实现的那张截图**。
3. 在发送框中敲下几个有魔力的字符：`/img2code`

### 背后逻辑
IDE 的超级视觉理解大脑会秒级根据：
- 图片展现了哪些组件（它能精准识别为 Vant 或者内置的元素）。
- 这属于空白的普通移动端 H5，还是带系统导航栏的 Admin？
进而把一份完美符合该页面的 **`YAML Schema 建筑图纸`** 落地在你的目录 `schemas/pages/你的页面名.schema.yaml` 下。并且随后终端自动一闪：
`✔ src/views/新界面... 已生成`。不需要懂怎么写规范，也能感受全自动落盘带来的统治力。

---

## 🏗️ 魔法 2：手写建筑图纸 (Schema 定位解析)

即便你不使用看图功能，通过手工打磨 `YAML Schema`，你也将体验到“声明式开发”的降维打击。

请在 `schemas/pages` 目录下，直接放一个 `ProductDetail.schema.yaml`。里面就写这十来行：
```yaml
---
page_id: ProductDetail       
title: 商品详情信息             
layout: blank                # H5 空白底座页面；后续可能会改成 tabbar 等     
route: /goods/detail         # 你想要的 URL 地址
api_endpoints:               # 你想要挂载的接口方法
  - getGoodsInfo
components:                  # 设计中涉及的核心可视化骨架
  - VanNavBar
  - VanSwipe
  - VanGoodsAction
state:                       # 你想存的基础响应式数据
  - productData: object
track:                       # 公司要求的曝光监控标识代码
  - pv-goods-detail
version: "1.0"
---
```

**执行奇迹：**
然后在你的命令行中敲击：
```bash
npx fe-factory generate --schema schemas/pages/ProductDetail.schema.yaml
```
（你完全可以只打 `npx fe-factory` 打开那个交互式的互动菜单面板进行图形化确认！！）

此时，“工厂架构引擎” 会瞬间完成对你这种 `YAML` 的解析翻译。

**你到底拿到了什么？**
1. 你的 `src/router/index.ts` 最后自动追加了一行，匹配 `/goods/detail` 路由。
2. 你的 `src/views/ProductDetail/index.vue` 直接引入了 `<van-nav-bar>` 等核心库标签骨架。不再自己傻傻去找文档抄导入语句。
3. `getGoodsInfo()` 这个异步请求方法自动帮你定义和注入到了对应的 Vue Hook 文件中。你的页面中也引入了相应的 `useProductDetail.ts` 中间件。

---

## 🌐 魔法 3：后端接口联机脱手 (Swagger Sync)

除了写页面外，对于后端几百个字段的大体量接维：

```bash
npx fe-factory sync --swagger https://your-company.com/api/v2/api-docs
```

工厂架构中的 `sync.js` 全球路由嗅探能力被触发，自动拉取后端那错综复杂的 JSON 规范。为你生成极纯真的 `.ts` 请求与响应的静态接口（interface）代码文件并自动落地在 `src/api` 之内。
**以后一旦后端改字段报错，TypeScript 将立刻红底提示！彻底告别联调因为少加双引号而导致的找虫烦恼。**

---

## 👨‍💻 接下来去哪？（开发者最后交接手册）

生成出来的代码并不是僵化不可测的黑盒！

工厂帮你把那些费脑子又枯燥的 “架子、路由、Vue API 导入、强类型网络拦截” 做完了，这就叫——业务底层。
然后？打开你刚生成的比如 `src/views/xxx/index.vue`，你会发现在关键部分留有：

`<!-- CONTENT: 在这里添加你的列表等具体业务逻辑 -->`

你只需要利用你手上的经验，去补充点击事件里面的逻辑走向即可！这不仅将规范死死捏在架构师手里，还为业务端的代码重用带来超乎寻常的生产力跃升！
