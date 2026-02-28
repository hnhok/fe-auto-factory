---
name: requirements-analysis
description: >
  阶段1：需求分析 & Schema 驱动设计。将 PRD 文本转化为机器可读的 Page Schema，
  自动识别所需组件、API 端点、权限和状态，生成后续开发阶段所有输入。
---

# 📋 Skill 01 — 需求分析 & Schema 驱动设计

## 目标
将产品需求文档（PRD）转化为标准化的 **Page Schema YAML**，作为后续代码生成的"元数据蓝图"。

---

## 步骤一：PRD 标准化模板

所有需求文档必须符合以下格式（位于 `docs/requirements/*.md`）：

```markdown
---
page_id: OrderDetail          # 页面唯一ID（PascalCase）
title: 订单详情               # 页面标题
layout: dashboard             # 布局类型: blank | dashboard | tabbar
route: /order/:id             # 路由路径
api_endpoints:                # 消费的 API 端点列表
  - getOrderDetail
  - updateOrderStatus
  - cancelOrder
components:                   # 需要的组件列表
  - VanNavBar
  - DataTable
  - StatusBadge
  - ActionSheet
state:                        # 页面级状态
  - orderInfo: object
  - loading: boolean
  - currentStatus: string
auth:                         # 需要的角色权限
  - admin
  - manager
track:                        # 埋点事件
  - order-cancel-click
  - status-update-click
version: "1.0"
---

## 功能描述
...（业务描述）

## User Story
- 作为管理员，我可以查看订单的完整信息
- 作为管理员，我可以更新订单状态
- 作为管理员，我可以取消订单并填写原因

## 接受标准
- [ ] 订单状态实时展示
- [ ] 取消订单需弹出确认 ActionSheet
- [ ] 操作成功后自动刷新数据
```

---

## 步骤二：Schema 自动提取

运行以下命令，从 PRD Markdown 提取 Schema：

```bash
node scripts/factory.js extract --prd docs/requirements/order-detail.md
```

**产出文件**：`schemas/pages/order-detail.schema.yaml`

---

## 步骤三：Schema 校验

```bash
node scripts/factory.js validate-schema --file schemas/pages/order-detail.schema.yaml
```

校验规则（来自 `schemas/page.schema.json`）：
- `page_id` 必须 PascalCase
- `route` 必须以 `/` 开头
- `api_endpoints` 必须与 Swagger 中存在的端点匹配
- `components` 必须在组件库白名单中

---

## 步骤四：组件清单对齐

根据 Schema 中的 `components` 列表，自动检查：

| 检查项 | 规则 |
|-------|------|
| Vant 原生组件 | 直接使用，无需自定义 |
| 业务组件 | 检查 `src/components/` 是否已存在 |
| 缺失组件 | 触发组件生成 Skill（skill-02） |
| 设计稿颜色 | 自动映射到 `src/styles/variables.less` 中的 Token |

---

## 步骤五：API 端点预检

自动从 Swagger/OpenAPI 读取端点定义，核查：
- 请求参数类型
- 响应数据结构
- 是否需要 Auth Token

生成 `src/api/types/order.types.ts`（自动类型推导）。

---

## ✅ 阶段1 完成标志

- [ ] PRD Markdown 文件存在且通过 lint
- [ ] Page Schema YAML 已生成并通过 Schema 校验
- [ ] 所有 API 端点已在 Swagger 中确认存在
- [ ] 组件清单已对齐（缺失组件已标记待生成）
- [ ] 埋点事件 ID 已确定

---

## 📂 产出物

```
schemas/pages/[page-id].schema.yaml   # 主 Schema 文件（供 skill-02 消费）
src/api/types/[page-id].types.ts      # 自动生成的 API 类型
docs/requirements/[page-id].md        # 原始需求文档（归档）
```
