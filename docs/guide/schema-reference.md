# 📋 核心：Schema 图纸规范全集 (Reference)

所有能被我们引擎接管的代码生成操作，全部收敛在强类型的 YAML (或 JSON) 的声明之内。这保证了哪怕是没有代码背景的产品线研发，也能以最快的速度提供前端可读的 PRD 图纸。

我们通过 `ajv` 对该描述结构做了坚不可摧的保障！

## `pagesDir` 下的一份标准 YAML 

在 `schemas/pages/` 目录下创建一个 `UserManagement.schema.yaml`，内容即为该页面的蓝图：

```yaml
# 页面全局唯一 ID，影响所有文件路径、Hook 与组件命名以及 Store ID 
page_id: UserManagement

# 中文路由 / 文档标题
title: 客户管理后台大盘

# 决定该组件挂载在什么 Layout 下（如果你用的是 admin 系列模板）
layout: default

# 💡 特性开关 (Features Toggle)
# 这里控制你的引擎需要为你植入哪些重型或轻型组合
features:
  pagination: true    # 自动为你带上基于 list 的增删查改和分页变量、API、滚动翻页UI行为
  search_bar: true    # 是否包含检索过滤的表单结构头
  track_clicks: false # 无埋点自动收集

# 📦 数据骨架 (Model Definition)
# 这里你无需手动写繁琐的 interface / type。写在这里，TS 即所得！
models:
  User:
    id: number
    name: string
    isVip: boolean
    # 也支持局部嵌套模型
    address:
      city: string
      zipcode: string
      
  # 也可以直接引用全局位于 .factory/models/ 下的模型，极大地减少冗余
  $ref: '#/definitions/BaseResponse' 

# 🔌 API 注射槽 (Hooks)
# 这些会被自动下沉为真实的 Service 调用、TS 类型包，并与上面的模型耦合，提供给你的 `useUserManagement.ts` Hook。
api_endpoints:
  - getUserList
  - deleteUserById
  - updateUserStatus

# 🧩 页面内挂载的组件（如果有剥离开的组件也可以在这里标定挂载关系）
components:
  - UserStatusTag
  - SearchPanelForm

# 🧭 额外状态 (Pinia & Reactivity)
# 可选。除了自动生成的列表项，还可以指定页面内你需要的其他核心状态变量。
state:
  currentCategory: string
  isActionLoading: boolean
  
```

## Schema 运行机制与产出清单

一旦 `YAML` 通过 `ajv`（我们在 `schemas/page.schema.json` 定义的强类型约束库）审查成功之后，CLI 会瞬间利用渲染沙箱 (Plugins or default drivers) 为你生成一棵代码树。

它不仅只生成 Vue/React 文件，它还遵循着**前端工业界最佳目录拆分实践**：
- `src/views/UserManagement/index.vue`
- `src/views/UserManagement/hooks/useUserManagement.ts`（业务逻辑剥离）
- `src/api/user-management.ts` （带有完整 Typescript 和 Axios 响应拦截的代码）
- `src/api/types/user-management.ts` （Model 定义落盘地）
- `src/store/user-management.ts` （响应式数据流向：Pinia 或 Redux）

> 🔒 **智能 AST 缝合 (v3.0+) 提醒**
> 请尽情编辑里面带 `[FACTORY-HOOK-CUSTOM-START]` 标记的区域，下次即使您在上面的 `api_endpoints` 增加了新的请求函数并重新运行 `generate`，您曾经手写的代码也不会被覆盖，引擎会将新的函数自动在 TS/JS 的 AST 里无损组装！
