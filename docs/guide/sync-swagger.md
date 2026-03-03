# 同步后端 API (Swagger Sync)

对于任何前端团队来说，手动依据后端接口文档拼装本地 `TypeScript Types/Interfaces` 无疑是非常耗时且容易出错的。

我们在其中加入了 `sync` 指令。该指令的作用是从远端 Swagger 或本地开放 API JSON 中反解析：

```bash
# 例子：拉取 Petstore 的远程接口数据规范，直接在脚手架指令中：
npx fe-factory
> 选择 [🌐 同步 Swagger 接口]
> 输入 Swagger JSON 地址: https://petstore.swagger.io/v2/swagger.json
```

底层基于 AST 及类型转换算法解析 JSON 模型。此时脚手架将在你所在项目的 `src/api/types.ts` 直接生成出所有被强类型包围的模型。（该系统目前支持 `Swagger 2` 及 `OpenAPI 3` 降级解析）

### 🌟 [v3.1.0] 突破：Swagger -> 页面 Schema 的智能逆向推导 (API-Driven UI)

这是业界首创的闭环体验。当执行同步操作时，引擎不仅会生成类型定义，还会启动 **大模型与语义分析启发式启发引擎** (Heuristic Reverse Engine)。它会自动捕捉 OpenAPI 中核心的业务实体（如 Order、Product），然后**向本地反向暴露出标准规范的 `.schema.yaml` 前端页面架构图纸**。

> 从后端写好接口那一刻，前端连“画架构数据结构图纸”的操作都被机器包揽了。你直接运行 `generate`，连通全套 Mock 与 UI 的视图层立马出栈。
