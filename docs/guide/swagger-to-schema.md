# 🔄 面向后端：Swagger (OpenAPI) 反向工程

你可能觉得手写上述复杂的 YAML 太过繁琐，或者你们的团队强依赖后端提供的 Swagger 文档 (`api-docs`) 接口协议。

自 `v3.1.0` 以来，前端自动化工厂全面支持了“**逆向解析 Swagger 生成驱动框架**”的能力！

## 场景实战与调用

### 1. 同步全量后端协议与类型树

你可以直接在拥有 `.factory` 结构的项目下输入：

```bash
npx fe-factory sync --swagger http://your-backend-api/v2/api-docs
```

> 🔥 **智能感知与去冗余**
> 工具在抓取并遍历完 JSON/YML 协议后，并不会生成乱七八糟海量的丑陋代码。它会通过内部的 AST 算法去对接口按模块分割，比如 `/api/user/*` 会被聚类到一起。并且对重复请求的 `DataModel` 类型在底层做了提取，转为了 `schemas/models/*.yaml` 公共组件挂载模型池。

### 2. 将特定模块萃取为 页面 Schema

当后端的类型池一旦转为本地静态资产后，你可以很方便地复用他们从而创建出一份真正的 UI Schema：

```bash
# 假设抓取的接口里有一个 /api/order 相关分类
npx fe-factory sync --swagger http://your-api-doc --extract OrderList
```

引擎将会直接为你生成一份 `schemas/pages/OrderList.schema.yaml`！
这包含了它解析出来的所有类型定义、所有接口列表（`getOrderList`, `deleteOrder` 等）和它判定可能需要的页面挂载点。

你打开这份大草图（图纸），按需微调里面的 `features` 或者修改 `title` 后，你不仅拿到了全部免费、带智能类型的网络请求代码，还能直接在控制台敲下最后一行指令，让页面为你自动拔地而起：

```bash
npx fe-factory generate --schema schemas/pages/OrderList.schema.yaml
```
