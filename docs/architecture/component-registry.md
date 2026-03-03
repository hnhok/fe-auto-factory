# 组件复用检测系统 (Component Registry)

> **v3.4.0 新增功能**。每次 `generate` 前自动扫描全项目已有组件，已存在的组件直接复用引用路径，只对真正新增的组件生成骨架文件，杜绝重复创建组件。

---

## 问题背景

在传统工作流中，每次执行 `generate` 都会对 Schema 里声明的所有组件生成骨架文件：

```
# Schema 声明了 3 个组件
components:
  - SearchPanel    ← 项目里已经有了！
  - StatusBadge    ← 项目里已经有了！
  - ActionButtons  ← 真正需要新建
```

如果不加检测，引擎会："已有文件则跳过"——但跳过不等于复用！生成的视图文件里还是会引入错误的相对路径，开发者仍需手动修复 import。

---

## 工作原理

```
执行 generate
  ↓
buildComponentRegistry() — 递归扫描全项目
  ├── src/components/**/*.vue     (全局组件，最高优先级)
  └── src/views/*/components/*.vue  (页面组件，次优先级)
  ↓
classifyComponents() — 对 Schema.components 分类
  ├── UI 库组件 (Van*, El*, Ant* 前缀) → 直接跳过，三方库
  ├── 已存在组件 ♻️                   → 返回正确 importPath
  └── 全新组件 🆕                    → 生成骨架文件
  ↓
enrichedParams.reusedComponents → 注入视图模板
```

---

## 控制台输出示例

```bash
$ npx fe-factory generate --schema schemas/pages/ProductList.schema.yaml

▶ 🚀 [Micro-kernel] 将接力棒转交驱动生命周期 hook...

  ℹ️  组件复用检测：以下组件已在项目中存在，跳过生成：
     ♻️  SearchPanel   →  ../../components/SearchPanel/index
     ♻️  StatusBadge   →  ../OrderList/components/StatusBadge

    ✔ Component New: ProductList/components/ActionButtons.vue

✅ 代码生成完成！
```

---

## 目录结构规范

为了使引擎能正确识别，请遵守以下放置规范：

```
src/
├── components/                    ← 全局共享组件（3个以上页面复用）
│   ├── SearchPanel/
│   │   └── index.vue
│   └── StatusBadge.vue
│
└── views/
    └── OrderList/
        └── components/            ← 页面私有组件（仅本页面使用）
            └── OrderTag.vue
```

**规范细则：**
- 全局组件放 `src/components/`，命名 **PascalCase**
- 跨 3 个以上页面使用的组件必须提升到全局目录
- 页面私有组件放 `src/views/[PageId]/components/`

---

## 自定义组件注册

如果你有组件存放在非标准路径，可以在 `.factory/config.json` 中声明：

```json
{
  "preset": "vue3-element-admin",
  "customComponents": ["MySpecialButton", "CompanyHeader", "GlobalFooter"]
}
```

这些组件名会被加入验证器的白名单，不触发"非标准组件"警告。

---

## 手动检查注册表

```bash
node --input-type=module --eval "
import { buildComponentRegistry } from './scripts/snapshot/component-registry.js'
const reg = buildComponentRegistry(process.cwd())
console.log('📦 已有组件数量:', reg.size)
for (const [name, path] of reg) {
  console.log('  -', name.padEnd(20), path.replace(process.cwd(), '.'))
}
"
```
