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

### 2. (v3.4.0 新功能) 批量业务实体逆向工程 (Batch Reverse Engineering)

在 `v3.4.0` 之前，逆向工程主要依赖人工指定实体名。现在，当你运行 `sync --swagger` 时，工厂会自动执行 **「地毯式扫描」**，极大地缩短了大型项目从 0 到 1 的图纸准备周期：

1. **自动识别业务对象**：引擎通过内置的智能过滤器，自动剥离 `BaseResponse`、`PageResult`、`CommonWrapper` 等泛型包装类，直取核心业务模型（如 `Order`、`User`、`VipCard`）。
2. **多图纸矩阵产出**：为每一个识别出的业务实体在 `schemas/pages/` 下生成一份对应的独立 Schema 图纸草稿，并自动推导出 `getXXXList` 和 `getXXXDetail` 等标准 API 调用链。
3. **渐进式同步 (Safe Sync)**：遵循「开发者优先」原则，若对应的图纸文件已在本地存在，同步器将跳过写入，保护您已经在 Schema 中调整过的 UI 特性和逻辑。

现在，即使面对一个拥有上百个实体的庞大 Swagger 文档，你也只需几秒钟，就能完成全项目「页面 Schema 底座」的批量敷设。

---

### 3. 从草图到落地

一旦图纸生成，你只需打开这些大草图进行按需微调（如调整 `title` 或开启 `search_bar` 等特性），随后运行以下指令，业务页面即可自动拔地而起：

```bash
# 💡 提示：使用 npx fe-factory list 查看当前有哪些图纸尚未落地
npx fe-factory generate --schema schemas/pages/Order.schema.yaml
```
