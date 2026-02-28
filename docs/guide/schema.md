# Schema 规范

在 `fe-auto-factory` 中，一切自动化生成的基础都是 Schema 文件。目前使用 `YAML` 格式定义。

## 字段详解

以下是一个标准的页面 Schema 示例：

```yaml
---
page_id: AdminDashboard      # 页面唯一 ID，建议使用 PascalCase (必填)
title: 后台控制面板          # 页面的中文标题
layout: admin                # 布局模板选型: [blank, admin, dashboard, tabbar, fullscreen]
route: /admin/dashboard      # 在 vue-router 中挂载的路由路径
api_endpoints:               # 该页面引用的后端接口列表，将自动引入关联函数
  - getSystemStats
components:                  # 需要引入的组件白名单
  - VanGrid
  - VanGridItem
state:                       # 自动生成的本地响应式状态清单 (Ref / Reactive)
  - stats: object
track:                       # 埋点系统事件 ID，将自动建立上报插槽
  - admin-dashboard-view
version: "1.0"               # Schema 配置版本，用于控制脚手架更新
---
```

脚手架在启动前会强制通过 `Ajv` 校验机制判断你编写的 Schema 文件是否与预先规定的结构相符。如果类型出错将直接中断代码产出。
