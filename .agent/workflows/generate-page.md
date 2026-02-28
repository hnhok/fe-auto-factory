---
description: 从 Page Schema 生成完整页面代码（页面骨架、Hook、API、Store、E2E 测试）
---

# 工作流：Schema 驱动代码生成

## 前置条件
- 项目已通过 `init-project` 工作流初始化
- Schema 文件位于 `schemas/pages/` 目录

## 步骤

### 1. 确认 Schema 文件存在且合规

打开目标 Schema 文件，确认以下字段填写完整：
- `page_id` (PascalCase)
- `title` (中文标题)
- `route` (路由路径)
- `api_endpoints` (API 函数名列表)
- `components` (组件列表)
- `track` (埋点事件 ID)

### 2. 运行 Schema 校验

```powershell
node ../fe-auto-factory/scripts/factory.js validate-schema --file schemas/pages/<filename>.schema.yaml
```

确认输出无 ❌ 错误（⚠️ 警告可以忽略）。

### 3. 执行代码生成

```powershell
node ../fe-auto-factory/scripts/factory.js generate --schema schemas/pages/<filename>.schema.yaml
```

### 4. 查看生成的文件

确认以下文件已生成：
- `src/views/<PageId>/index.vue` — 页面骨架
- `src/views/<PageId>/hooks/use<PageId>.ts` — 业务 Composable
- `src/api/<kebab-case>.ts` — API Service
- `src/store/<kebab-case>.ts` — Pinia Store  
- `tests/e2e/<kebab-case>.spec.ts` — E2E 测试脚本

### 5. 填写业务逻辑（开发者任务）

在生成的文件中，搜索以下标记并填写：
- `// TODO:` — 需要填写的视图/业务逻辑
- `// BUSINESS LOGIC:` — 核心业务公式区域

### 6. 运行质量检查

```powershell
node ../fe-auto-factory/scripts/factory.js validate
```

### 7. 启动开发验证

```powershell
npm run dev
```

访问 `http://localhost:5173/<route>` 验证页面正常渲染。

## 完成标志
- 所有生成文件存在
- `// TODO:` 标记全部填写完毕
- `npm run lint` 无错误
- 页面在浏览器中正常显示
