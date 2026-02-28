---
description: 初始化新的 FE-Factory 前端项目
---

# 工作流：初始化 FE-Factory 项目

## 前置条件
- 已安装 Node.js 20+
- `fe-auto-factory` 工厂目录存在于 `C:\Users\MYPC\.gemini\antigravity\scratch\fe-auto-factory`

## 步骤

### 1. 创建项目

```powershell
cd C:\Users\MYPC\.gemini\antigravity\scratch
node fe-auto-factory/scripts/factory.js init <project-name>
```

### 2. 进入项目并安装依赖

```powershell
cd <project-name>
npm install
```

### 3. 创建第一个页面的 Schema

在 `schemas/pages/` 目录下创建 YAML 文件，参考 `../fe-auto-factory/schemas/examples/order-detail.schema.yaml`：

```yaml
---
page_id: HomePage
title: 首页
layout: tabbar
route: /
api_endpoints:
  - getHomeData
components:
  - VanNavBar
  - VanList
track:
  - home-item-click
version: "1.0"
---

## 功能描述
...
```

### 4. 验证 Schema

```powershell
node ../fe-auto-factory/scripts/factory.js validate-schema --file schemas/pages/home-page.schema.yaml
```

### 5. 生成页面代码

```powershell
node ../fe-auto-factory/scripts/factory.js generate --schema schemas/pages/home-page.schema.yaml
```

### 6. 启动开发服务器

```powershell
npm run dev
```

### 7. 验证生成代码质量

```powershell
npm run lint
npm run build
```

## 完成标志
- 项目目录已创建
- `npm run dev` 可正常启动
- 生成的页面文件存在于 `src/views/<PageId>/`
- `npm run lint` 无错误
