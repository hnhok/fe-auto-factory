---
description: 从 Page Schema 生成完整页面代码（页面骨架、Hook、API、Store、E2E 测试）
---

# /generate-page — Schema 驱动代码生成工作流

当用户请求"生成某个页面"或提供了 Schema 描述时，严格按照以下步骤执行。

## 前置条件
- 项目已通过 `/init-project` 工作流初始化
- 项目根目录存在 `.factory/config.json`（含正确的 `preset` 字段）

---

## 步骤 1：需求理解与 Schema 确认

若用户只是描述了功能而未提供 Schema：
1. 根据用户描述，使用 `write_to_file` 在 `schemas/pages/<PageId>.schema.yaml` 创建符合规范的图纸
2. Schema 必须包含字段：`page_id`（PascalCase）、`title`、`route`、`api_endpoints`、`components`、`track` 和 `version`

若用户已提供 Schema 文件路径，直接进入步骤 2。

---

## 步骤 2：Schema 格式校验

// turbo
```bash
npx fe-factory validate
```
确认输出无 ❌ 错误。若有校验失败，先修复 Schema 中的问题再继续。

---

## 步骤 3：组件复用预检（新增）

// turbo
在正式生成前，先了解项目中已有哪些组件，以便确认 Schema 中的 `components` 是否有可复用项：
```bash
node --input-type=module --eval "
import { buildComponentRegistry } from './scripts/snapshot/component-registry.js'
const reg = buildComponentRegistry(process.cwd())
if (reg.size) {
  console.log('\\n📦 当前项目已有组件 (' + reg.size + ' 个):')
  for (const [name] of reg) console.log('  -', name)
} else {
  console.log('\\n📭 项目暂无可复用的业务组件')
}
"
```

如输出的已有组件列表中包含 Schema `components` 字段里的某个组件，告知用户该组件将在生成时自动复用，不会重复创建文件。

---

## 步骤 4：执行核心代码生成

// turbo
```bash
npx fe-factory generate --schema schemas/pages/<PageId>.schema.yaml
```

确认终端输出包含：
- ✔ `View:` 路径（页面骨架）
- ✔ `Hook:` 路径（业务 Composable）
- ✔ `API:` 路径（接口 Service）
- ✔ `Store:` 路径（Pinia 状态）
- ✔ `Test:` 路径（E2E 测试脚本）
- ♻️（若有）`组件复用检测：...` 已有组件的复用摘要

---

## 步骤 5：质量检查

// turbo
```bash
npx fe-factory validate
```

若有 ESLint 错误（红色 ❌），根据错误提示修复：常见问题包括：
- 缺少 `data-track-id` 属性
- 异步函数缺少 try/catch
- API URL 硬编码

---

## 步骤 6：启动并验证

// turbo
```bash
npm run dev
```

提示用户在浏览器访问 `http://localhost:5173/<route>` 验证页面正常渲染。

---

## 完成标志

- [ ] 所有预期文件均已生成
- [ ] 已有组件已复用，无重复文件
- [ ] `validate` 检查无错误
- [ ] 页面在浏览器中正常渲染
- [ ] `// TODO:` 标记处已填入业务逻辑
