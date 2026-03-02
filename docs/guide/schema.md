# Schema 规范

在 `fe-auto-factory` 中，一切自动化生成的基础都是 Schema 文件。目前使用 `YAML` 格式定义。

## 字段详解

以下是一个标准的页面 Schema 示例：

```yaml
---
page_id: ProductList          # 页面唯一 ID，建议使用 PascalCase (必填) (v2.7.0)
title: 商品列表与管理          # 页面的显示标题
layout: admin                # 布局模板: [blank, admin, tabbar, dashboard]

features:                     # [v2.7.0] 开启业务增强特性
  pagination: true           # 开启分页逻辑 (PC) 或 无限滚动 (H5)
  pull_to_refresh: true      # 开启 H5 下拉刷新
  search_bar: true           # 自动渲染标准搜索表单

state:                        # [v2.7.0] 页面级响应式状态清单
  - "currentCategory: string" # 格式: "name: type"，自动同步至 Hook & Store
  - "lastActionTime: number"

models:                       # [v2.5.0] 领域数据建模
  Product:                   # 定义模型，将生成 IProduct 接口与 Mock 镜像
    id: number
    name: string
    price: number
    owner: "$ref: UserBase"  # [v2.6.0] 支持 $ref 引用全局模型集

api_endpoints:               # 该页面引用的后端接口列表
  - getProductList           # 自动生成关联 API 请求函数
  - deleteProduct

components:                  # 需要引入的组件白名单
  - VanButton
  - VanGrid

track:                       # 埋点系统事件 ID
  - PRODUCT_LIST_VIEW        # 自动建立上报插槽并同步至枚举

version: "1.1"               # Schema 配置版本
---
```

## 核心能力说明

1.  **强校验机制 (v2.0)**：脚手架在启动前会强制通过 `Ajv` 校验机制。如果 YAML 结构与规范不符，将直接中断代码产出，并在终端高亮报错路径。
2.  **模型引用 ($ref, v2.6)**：你可以在项目根目录下创建 `.factory/models/common.yaml`。通过 `$ref: ModelName`，多页面间可以共享同一套业务模型，极大提高类型维护效率。
3.  **功能感知 (Features, v2.7)**：工厂不只是生成 HTML，通过 `features` 开关，它能理解“列表加载”、“下拉刷新”等业务模式，并自动配套 Hook 内的请求锁、页码累加等逻辑。


脚手架在启动前会强制通过 `Ajv` 校验机制判断你编写的 Schema 文件是否与预先规定的结构相符。如果类型出错将直接中断代码产出。
