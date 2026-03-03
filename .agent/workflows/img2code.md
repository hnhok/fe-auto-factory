---
description: 从设计稿/图片智能生成前端页面并预览闭环（含视觉快照复用）
---

# /img2code — 视觉解析与代码生成体系（v2 快照版）

当用户向你发送了一张 UI 设计稿、产品原型或者界面截图，并附带 `/img2code` 指令时，请严格按照以下自动化流水线执行所有工作。

> **重要原则**：能复用就不重新生成。每次识别图片前，必须先查快照库，避免重复消耗 AI Token！

---

## 阶段 0：快照库预检（先查库，再识别）

// turbo
1. 首先查询当前项目的视觉历史快照库，检查是否有完全相同或高度相似的图片已被识别过：
   ```bash
   npx fe-factory vision snapshot list
   ```
2. 审查控制台输出的快照清单，判断是否有与当前图片高度匹配的历史记录。

**分支决策：**
- ✅ **发现完全相同的图片**（相同 MD5）：直接跳到「阶段 3 — 生成代码」，使用历史 Schema 图纸，**无需调用 AI**。
- 🔍 **发现高度相似的图片**（相似度 ≥ 45%）：提示用户"发现相似历史快照"，建议在历史 Schema 基础上调整后再生成，或使用 `--force` 强制重新识别。
- ❌ **无匹配**：继续执行后续阶段，调用 AI 视觉识别。

---

## 阶段 1：快照库未命中 → 理解图片，提炼 YAML 图纸

作为高级架构师，全面拆解图片：

1. **页面特征定位**：是 H5（移动端）还是带侧边栏的后台 Admin 界面？
2. **核心业务诉求**：页面是什么功能？（登录、商品列表、配置中心等）
3. **识别组件层级**：出现了什么 UI 元素？映射为 Vant 4 或 Element Plus 具体组件名。
4. **功能特性检测**：是否有分页？是否有搜索框？

**请不要输出包含解释的 Markdown 内容**。以精细度生成标准的 `fe-auto-factory` YAML Schema：

```yaml
page_id: UserLogin           # 严格的 PascalCase
title: 用户登录校验
layout: blank                # blank (H5) 或 admin (后台)
route: /user/login
features:
  pagination: false
  search_bar: false
api_endpoints:
  - submitLogin
  - sendSmsCode
components:
  - VanForm
  - VanField
  - VanButton
state:
  formData: object
models: {}
track:
  - login-page-view
version: "1.0"
```

// turbo
2. 将 Schema 写入 `schemas/pages/<PageName>.schema.yaml`：
   ```bash
   # Agent 使用 write_to_file 工具将 YAML 写入对应路径
   ```

---

## 阶段 2：快照入库（识别结果持久化）

// turbo
3. 将本次识别结果写入快照库（下次相同/相似设计稿直接复用）：
   ```bash
   npx fe-factory vision <图片路径> --note "<业务描述，如：订单列表v2带搜索栏>"
   ```
   > 注：如果 Agent 已直接分析图片内容而未使用 CLI vision 命令，请调用工厂的 saveSnapshot SDK 手动入库，或提醒用户手动执行上述命令完成入库。

---

## 阶段 3：组件复用预检 + 执行底层工厂代码生成

// turbo
4. 执行生成时，引擎会自动运行组件注册表扫描，将已存在的组件标记为「复用」，仅生成真正新增的组件骨架：
   ```bash
   npx fe-factory generate --schema schemas/pages/<你的PageName>.schema.yaml
   ```

5. 仔细检查终端输出，确认：
   - ✔ `views/`, `hooks/`, `store/`, `api/`, `router`, `e2e` 均已生成
   - ♻️ 已存在的组件显示「复用」标记，未重复创建文件
   - 无红色错误信息

---

## 阶段 4：报告与建议

一旦全部生成完毕，以欢快骄傲的语气向用户汇报：

- ✅ 已识别并生成代码骨架
- ♻️ 如有组件复用，告知哪些组件复用了已有文件
- 📦 本次识别结果已入库，下次相同图片可 0 成本直接复用
- 🔗 建议用户访问 `http://localhost:5173/<route>` 验证页面效果
