# Skills 总览索引 (FE-Auto-Factory Skill Directory)

本目录记录了 `FE-Auto-Factory` 系统内的所有 **Skill（工艺阵列）** 及其适用时机。

每个 Skill 是一套独立的、在特定阶段被精确唤起的 **最佳实践规范文档**，格式遵循 `SKILL.md` 标准。 

AI Agent 在处理开发任务时，应当按照任务类型匹配下表中的对应 Skill，并严格遵照其中的步骤规范执行。

---

## 📋 流水线阶段 Skills（按研发生命周期排列）

| # | Skill Name | 适用阶段 | 触发时机 | 文件路径 |
|---|-----------|---------|---------|---------|
| 01 | `requirements-analysis` | 需求分析 | 收到 PRD 文档 / 口述需求 / 提取 Schema | `skills/01-requirements/SKILL.md` |
| 02 | `automated-development` | 代码生成 | 执行 `generate` / 按 Schema 生成骨架 | `skills/02-development/SKILL.md` |
| 03 | `automated-testing` | 质量守卫 | 生成或修改页面后 / PR 提交前 | `skills/03-testing/SKILL.md` |
| 04 | `deployment-pipeline` | 部署上线 | 合并主分支 / 触发 CI 流水线 | `skills/04-deployment/SKILL.md` |

---

## 🧩 专项增强 Skills（跨阶段按需调用）

| # | Skill Name | 职责 | 触发时机 | 文件路径 |
|---|-----------|-----|---------|---------|
| 05 | `component-reuse` | 组件复用策略 | 识别出 Schema 包含 `components` 时 | `skills/05-component-reuse/SKILL.md` |
| 06 | `vision-snapshot` | 设计稿视觉快照积累 | 执行 `vision` 命令时 | `skills/06-vision-snapshot/SKILL.md` |
| 07 | `code-review` | AI 代码规范审查 | PR 开启 / pre-commit 触发 | `skills/07-code-review/SKILL.md` |
| 08 | `performance-guard` | 性能基准与优化规范 | Lighthouse CI 运行 / 上线前自检 | `skills/08-performance/SKILL.md` |

---

## 🔁 Skill 之间的依赖关系

```
[01-requirements]
       ↓ 产出 Schema YAML
[02-development] ──→ [05-component-reuse]  (组件检测)
                 ──→ [06-vision-snapshot]  (设计稿识别)
       ↓
[03-testing] ──→ [07-code-review]          (AI 审查)
             ──→ [08-performance]          (性能基准)
       ↓
[04-deployment]
```

---

## 🤖 AI Agent 调用规范

当任务描述匹配以下关键词时，Agent 应主动 `view_file` 读取对应 Skill 的完整内容：

- **"从设计稿/原型/截图生成"** → `06-vision-snapshot` + `02-development`
- **"生成页面/组件"** → `01-requirements` → `02-development` → `05-component-reuse`
- **"测试/E2E/验收"** → `03-testing` + `07-code-review`
- **"部署/发布/上线"** → `04-deployment` + `08-performance`
- **"优化/性能/Lighthouse"** → `08-performance`
