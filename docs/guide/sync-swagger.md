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
