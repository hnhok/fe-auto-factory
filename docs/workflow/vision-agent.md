# AI 视觉生成：从设计稿到业务骨架 (Vision Agent)

前端团队经常需要拿到设计图直接生成 UI 代码。`fe-auto-factory` 结合多模态大模型能力，实现了**端到端的设计稿 → Schema → 完整代码**自动化闭环。

---

## v3.4.0 重大升级：视觉快照沉淀

v3.4.0 引入了**三重过滤通道**，大幅降低 AI Token 消耗：

| 通道 | 触发条件 | 处理方式 | Token 消耗 |
|:---:|---------|---------|:---------:|
| A | 图片 MD5 哈希完全相同 | 直接复用历史 Schema | **0** |
| B | Jaccard 相似度 ≥ 45% | 合并差量 | **极少** |
| C | 完全无匹配 | 调用 AI + 结果自动入库 | 正常 |

---

## CLI 原生模式

```bash
# 识别图片（自动查历史快照库）
npx fe-factory vision mockups/mobile-login.png

# 强制重识别（设计稿有改动时使用）
npx fe-factory vision mockups/mobile-login.png --force

# 带备注入库
npx fe-factory vision mockups/mobile-login.png --note "登录页v3，新增微信登录"

# 管理历史快照
npx fe-factory vision snapshot list
npx fe-factory vision snapshot delete <id>
```

**执行流程：**
```
图片路径
  ↓
① 查快照库（MD5 精确匹配）→ 命中：直接复用，不调用 AI
  ↓ 未命中
② 查快照库（Jaccard 相似匹配）→ 命中：提示合并，少量 Token
  ↓ 未命中
③ 调用视觉大模型 → 生成 Schema YAML
                 → 自动写入 schemas/pages/
                 → 自动入库（.factory/snapshots/）
                 → ♻️ 组件复用检测
                 → 执行 generate 生成代码
```

---

## IDE Workflow 模式（推荐）

在 Cursor、Antigravity 等支持工作流的 IDE 中，上传设计稿后直接输入：

```text
/img2code
```

工作流（`.agent/workflows/img2code.md`）会自动：

1. **阶段 0**：调用 `vision snapshot list` 检查历史快照库
2. **阶段 1**（未命中时）：AI 分析图片，生成标准 Schema YAML
3. **阶段 2**：结果写入快照库，供团队复用
4. **阶段 3**：调用 `generate`，执行组件复用检测，生成代码

> **相比旧版**：旧版 `/img2code` 每次都会调用 AI，新版在快照命中时 **0 Token** 完成生成。

---

## 大模型配置

视觉识别能力通过 `VLM_API_KEY` 环境变量配置：

```bash
# 在项目 .env 文件中设置
VLM_API_KEY=your-api-key
VLM_BASE_URL=https://api.moonshot.cn/v1   # 默认 Kimi
VLM_MODEL=moonshot-v1-8k-vision-preview
```

支持任何兼容 OpenAI Chat Completions 格式的视觉大模型接口。

---

## 相关文档

- [视觉快照存储详解 →](/workflow/snapshot-store)
- [组件复用检测系统 →](/architecture/component-registry)
- [快照管理工作流 → 使用 `/snapshot-manage`]
