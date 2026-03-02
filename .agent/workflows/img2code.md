---
description: 从设计稿/图片智能生成前端页面并预览闭环
---

# /img2code - 视觉解析与代码生成体系

当用户向你发送了一张 UI 设计稿、产品原型或者界面截图，并附带 `/img2code` 指令时，请严格按照以下自动化流水线为你执行所有的后续落盘与产出工作。

## 阶段 1：理解与提炼 YAML 图纸 (Schema)

作为高级架构师，请用你敏锐的视觉识别能力（Vision）全面拆解图片：
1. **页面特征定位**：它是 H5 (移动端) 还是带系统侧栏的面包屑后台 Admin 界面？
2. **核心业务诉求**：推导这个页面是做什么用的结构？(比如登录、商品列表、配置中心等)
3. **识别组件层级**：在这个页面里出现了什么具体的 UI 元素？映射为 `Vant 4` 的具体组件名（例如 `VanTabs`, `VanSwipe`, `VanCard` 等）。

请**不要输出包含解释、过渡语等 Markdown 内容**。你必须以系统级别的精细度生成一份标准的 `fe-auto-factory` YAML Schema。
（如果在 Vue3/TS 背景下，请根据图片估算出相关需要的 2~3 个 `api_endpoints` 与 `state`）

*请使用以下的 `replace_file_content` 或 `write_to_file` 工具，自动帮用户在 `schemas/pages/<PageName>.schema.yaml` 下创建该配置文件。*

参考以下结构（必须要有）：
```yaml
---
page_id: UserLogin           # 严格的 PascalCase
title: 用户登录校验          # 中文页面描述
layout: blank                # blank (H5) 或者 admin (后台) 
route: /user/login           # 相关路由路径
api_endpoints:
  - submitLogin
  - sendSmsCode
components:
  - VanForm
  - VanField
  - VanButton
state:
  - formData: object
track:
  - login-page-view
version: "1.0"
---
```

## 阶段 2：执行底层工厂代码生成 (Generate)
// turbo
1. 文件保存成功后，请立刻在包含有刚刚保存了 schema 的终端工作区内，向终端自动下发以下指令（请根据具体的工程确定是在 `fe-auto-factory` 自带测试区 还是 新的业务区，默认用 `node ./scripts/factory.js` 或 `npx fe-factory`）：
   ```bash
   npx fe-factory generate --schema schemas/pages/<你的PageName>.schema.yaml
   ```

2. 仔细检查由于刚运行上述指令后终端吐出的结果，必须确保成功产生包括 `views`, `hooks`, `store`, `router` 与 `e2e`。

## 阶段 3：体验反馈 (Report)
一旦全部生成到位，请在侧边栏用非常欢快骄傲的语气回复用户：代码骨架、本地 Hook、甚至包含 E2E 测试全部基于图片完成了构建！并推荐用户直接使用浏览器访问刚才对应声明生成的路由。
