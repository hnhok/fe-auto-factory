# 📖 Skill 使用指南 — FE-Auto-Factory

> 本文档说明如何在日常开发中使用 FE-Auto-Factory 的四个 Skill，以及如何将新团队经验沉淀回 Skill 体系。

---

## 🏁 如何使用 Skill

每个 Skill 都是一个 `SKILL.md` 文件，包含：
- **目标**：这个阶段要解决什么问题
- **步骤**：标准化的操作流程
- **产出物**：这个阶段结束后应该有哪些文件
- **完成标志**：CheckList，全部勾选才能进入下一阶段

### 调用规则

| 时机 | 读取 Skill |
|------|-----------|
| 开始一个新需求 | `skills/01-requirements/SKILL.md` |
| 开始写代码 | `skills/02-development/SKILL.md` |
| 准备提交 PR | `skills/03-testing/SKILL.md` |
| 准备上线 | `skills/04-deployment/SKILL.md` |

---

## 🔄 标准开发工作流

```
需求 → Skill-01 → Schema → Skill-02 → 代码 → Skill-03 → 测试 → Skill-04 → 上线
         │                    │                   │                   │
         ▼                    ▼                   ▼                   ▼
      PRD.md           factory generate       CI Pipeline        Sentry+埋点
     Schema.yaml       生成70%样板代码         全绿才部署          AI周报闭环
```

---

## 📋 Skill-01：需求分析

### 触发条件
接到新需求时，**在写任何代码前**先执行 Skill-01。

### 核心产出
```yaml
# schemas/pages/my-page.schema.yaml
page_id: MyPage
title: 我的页面
layout: blank
route: /my-page
api_endpoints: [getMyData]
components: [VanNavBar, VanList]
track: [my-button-click]
version: "1.0"
```

### 快速检查
```bash
# 校验 Schema 合规性
node ../fe-auto-factory/scripts/factory.js validate-schema \
  --file schemas/pages/my-page.schema.yaml
```

---

## 🔧 Skill-02：自动化开发

### 触发条件
Skill-01 的 Schema 文件通过校验后。

### 一键生成
```bash
node ../fe-auto-factory/scripts/factory.js generate \
  --schema schemas/pages/my-page.schema.yaml
```

### 生成后开发者只需做

1. **取消注释** `// myPageData` → 在 template 中使用数据
2. **填写 TODO** → 在 CONTENT 区域写 UI
3. **填写 BUSINESS LOGIC** → 在 hook 中写业务公式
4. **调整 API 路径** → 修改 `src/api/my-page.ts` 中的 endpoint

### 代码修正（自动触发）
```bash
# git commit 时自动执行（pre-commit hook）
npm run lint    # ESLint 自动修复
npm run format  # Prettier 格式化
```

---

## 🧪 Skill-03：自动化测试

### 触发条件
开发完成，准备提交 PR 前。

### 运行测试
```bash
# 全量测试（单元 + E2E）
node ../fe-auto-factory/scripts/factory.js test --all

# 仅单元测试
node ../fe-auto-factory/scripts/factory.js test --unit

# 仅 E2E
node ../fe-auto-factory/scripts/factory.js test --e2e
```

### 生成的 E2E 文件位置
```
tests/e2e/my-page.spec.ts
```
> 生成后请填写 `// TODO` 区域的业务测试步骤

### 性能检查
```bash
npm run build
npx lhci autorun  # 需安装 Lighthouse CI
```

---

## 🚀 Skill-04：部署与闭环

### 触发条件
所有测试通过，PR 合并到 main 分支后自动触发。

### 手动部署（紧急情况）
```bash
npm run build
# 上传 dist/ 到服务器
```

### 生成周报
```bash
node ../fe-auto-factory/scripts/factory.js report --week
# 输出: docs/reports/weekly-YYYY-WXX.md
```

---

## 🌱 如何将经验沉淀回 Skill

当你在项目中踩了一个新坑，**不要只是修复它**，同时更新 Skill 体系：

### 1. 将坑转化为 ESLint 规则
```javascript
// rules/fe-factory-rules.js → 添加新规则
'my-new-rule': {
  meta: { ... },
  create(context) { ... }
}
```

### 2. 将最佳实践写入对应 Skill
```markdown
// skills/02-development/SKILL.md → 追加到步骤三
### 3.x 新发现的规范
- 规则描述
- ❌ 错误示例
- ✅ 正确示例
```

### 3. 更新组件白名单
```javascript
// scripts/validator.js → VANT_COMPONENTS 数组
// 新增自定义业务组件
'MyNewComponent',
```

### 4. 更新 Schema 示例
```bash
# 将新页面的 Schema 模式复制到 schemas/examples/
cp schemas/pages/my-page.schema.yaml \
   schemas/examples/my-page-pattern.schema.yaml
```

---

## ⚠️ 常见问题

### Q: 生成的代码 TypeScript 报错怎么办？
A: 生成的代码中 `// camelData` 是注释状态，取消注释前请先在 template 中使用它，避免 `noUnusedLocals` 报错。

### Q: API 路径不对怎么办？
A: 修改 `src/api/<module>.ts` 中对应函数的 endpoint 路径，格式参考真实后端文档。

### Q: 路由没有自动注入怎么办？
A: 检查 `src/router/index.ts` 的格式，确保 `routes: [` 数组缩进为 4 空格。也可手动添加路由。

### Q: Schema 校验报 "组件不在白名单" 警告？
A: 这是警告非错误，可忽略。若是新的业务组件，将其加入 `scripts/validator.js` 的 `VANT_COMPONENTS` 数组。

---

## 📊 工厂产出物汇总

| 输入 | 工具 | 输出 |
|------|------|------|
| PRD 文档 | Skill-01 | `schemas/pages/*.yaml` |
| Schema YAML | `factory generate` | `src/views/*/` + `src/api/` + `src/store/` |
| 生成代码 | `factory validate` | ESLint 报告 |
| 生成代码 | `factory test` | 测试报告 + 覆盖率 |
| 上线数据 | `factory report` | `docs/reports/weekly-*.md` |
| 周报 | AI 分析 | 下一轮 Schema 输入 |
