---
name: component-reuse
description: >
  专项 Skill 05：组件复用策略。当代码生成器在 Schema 的 components 字段中
  检测到需要的组件时，优先扫描全项目已存在的组件，复用而非重复生成，
  并将已有组件的正确 import 路径注入到视图层。
triggers:
  - "generate 命令执行时，Schema 包含 components 字段"
  - "vision 命令解析设计稿后，提取出组件列表"
  - "人工开发时，在页面中需要引入业务组件"
---

# ♻️ Skill 05 — 组件复用策略 (Component Reuse)

## 目标
**杜绝重复造轮子**。每一次生成或开发页面前，必须先验证所需组件是否已在项目中存在，
存在则直接引用，不存在才允许创建新组件。

## 前提条件
- 项目已完成 `factory init` 初始化，存在标准的 `src/components/` 和 `src/views/` 目录
- Schema 文件中 `components` 字段已填写

## 涉及工具链
- `scripts/snapshot/component-registry.js` — 全项目组件扫描引擎
- `scripts/generators/base.js` — `generateComponentScaffolds` 函数（已集成注册表）
- `src/components/` — 全局共享组件存放目录（最高复用优先级）
- `src/views/*/components/` — 页面级私有组件目录（次级复用来源）

---

## 步骤一：了解扫描规则

引擎在 `generate` 时自动执行以下分类逻辑：

| 组件类型 | 识别规则 | 处理方式 |
|---------|---------|---------|
| **UI 库组件** | `Van*`、`El*`、`Ant*` 前缀 | 直接跳过，作为第三方库 import |
| **全局业务组件** | 存在于 `src/components/**/*.vue` | ♻️ 复用，计算相对 import 路径 |
| **页面级组件** | 存在于 `src/views/*/components/*.vue` | ♻️ 复用（优先级低于全局） |
| **全新组件** | 以上均未找到 | 🆕 生成骨架文件 |

---

## 步骤二：标准组件目录规范

为了使引擎能正确扫描，必须遵守以下目录放置规范：

```
src/
├── components/                    ← 全局共享组件（跨页面使用）
│   ├── SearchPanel/
│   │   └── index.vue             ← 推荐使用 index.vue 模式
│   ├── StatusBadge.vue           ← 简单组件可直接放 .vue 文件
│   └── DataTable/
│       └── index.vue
│
└── views/
    └── OrderList/
        └── components/            ← 页面私有组件（仅本页面使用）
            └── OrderStatusTag.vue
```

**规范细则：**
- 全局组件：放入 `src/components/`，命名使用 **PascalCase**
- 页面私有组件：放入 `src/views/[PageId]/components/`，仅当**确认不共用**时才放此处
- 不得在 `src/views/[PageId]/index.vue` 内定义内联组件

---

## 步骤三：手动触发组件检查

如果需要在不执行生成的情况下，单独检查某组件是否已存在：

```bash
# 通过 doctor 命令进行组件状态扫描
npx fe-factory doctor

# 直接手动检查（Node.js REPL）
node --input-type=module --eval "
import { buildComponentRegistry } from './scripts/snapshot/component-registry.js'
const reg = buildComponentRegistry(process.cwd())
console.log('已注册组件数量:', reg.size)
for (const [name, path] of reg) {
  console.log(' -', name, '->', path)
}
"
```

---

## 步骤四：新增全局组件的标准流程

当你需要新建一个**真正全局复用**的组件时，遵循以下步骤：

1. **命名评估**：确认该组件在 3 个以上不同页面中都会使用
2. **放置位置**：创建于 `src/components/[ComponentName]/index.vue`
3. **PropTypes 声明**：必须通过 `defineProps` 明确声明所有参数和类型
4. **文档注释**：在 `<script setup>` 顶部写明组件功能、Props 说明

```vue
<script setup lang="ts">
/**
 * SearchPanel — 通用检索面板
 * @props keyword - 关键词 (string)
 * @props onSearch - 点击搜索回调 (Function)
 * @emits search - 提交检索关键词
 */
defineProps<{
  keyword?: string
  placeholder?: string
}>()
defineEmits<{ search: [keyword: string] }>()
</script>
```

5. **注册验证**：新建完毕后运行 `doctor` 验证引擎能正确识别它

---

## ✅ 阶段完成标志

- [ ] Schema 中的所有 `components` 已经过注册表分类
- [ ] 已存在的组件没有被重新生成（控制台输出了 `♻️ 复用` 提示）
- [ ] 新生成的组件骨架已在 `src/views/[PageId]/components/` 中
- [ ] 全局组件已移至 `src/components/`

## 📂 产出物

```
src/components/[ComponentName]/index.vue  ← 全局新组件（如有）
src/views/[PageId]/components/[Name].vue  ← 页面私有新组件（如有）
# 已存在的组件无新文件产出，只有 import 路径注入到视图模板
```
