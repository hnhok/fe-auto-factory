# 视觉快照积累与复用系统 (Vision Snapshot Store)

> **v3.4.0 新增功能**。让每一次 AI 设计稿识别的结果成为团队的持久资产，下次遇到相同或相似的设计稿时，**零 AI 消耗直接复用**。

---

## 为什么需要快照系统？

传统的 `vision` 工作流存在一个根本性浪费：

```
设计稿 A → AI 识别 → 生成 Schema → 生成代码  ✓
设计稿 A（同一张） → AI 识别 → ... 再次消耗 Token ✗
相似的设计稿 B → AI 识别 → 从零生成，丢弃了已有组件知识 ✗
```

快照系统解决了这个问题，引入了**三重过滤通道**：

```
图片输入
  ↓
[通道 A] MD5 精确匹配 ─── 命中 → 0 Token 直接复用
  ↓ 未命中
[通道 B] Jaccard 语义匹配 ─── 相似度 ≥ 45% → 合并差量 + 少量 Token
  ↓ 无匹配
[通道 C] 全新 AI 识别 → 识别后自动入库 → 下次可复用
```

---

## 快速上手

### 识别设计稿（带快照预检）

```bash
# 自动查库 → 未命中时调用 AI → 识别后自动入库
npx fe-factory vision mockups/order-list.png

# 强制重新识别（忽略已有快照，适用于设计稿有改动的情况）
npx fe-factory vision mockups/order-list.png --force

# 识别并添加备注（方便后续团队检索）
npx fe-factory vision mockups/order-list.png --note "订单列表v2，含搜索栏"
```

### 管理快照库

```bash
# 查看所有历史快照
npx fe-factory vision snapshot list

# 删除特定快照
npx fe-factory vision snapshot delete OrderList-a1b2c3d4ef56
```

或通过交互菜单：
```bash
npx fe-factory
# 选择 "📸 从设计稿直接生成 (AI 视觉 + 快照复用)"
# 选择 "📚 查看历史快照库"
```

---

## 相似度匹配算法

匹配引擎基于 **Jaccard 相似系数**，按三个维度加权计算：

| 维度 | 字段 | 权重 | 说明 |
|-----|-----|:----:|-----|
| 组件重合度 | `components` | **50%** | 使用了哪些 UI 组件 |
| 接口重合度 | `api_endpoints` | **30%** | 调用了哪些后端接口 |
| 特性重合度 | `features` | **20%** | 分页、搜索等功能开关 |

当综合得分 ≥ **45%** 时，认为是相似快照，引擎会将已有快照的组件和接口与新识别的结果合并，保留已有知识。

---

## 快照数据结构

快照存储在 `.factory/snapshots/[PageId]-[hash].json`：

```json
{
  "_version": "1",
  "id": "OrderList-a1b2c3d4ef56",
  "page_id": "OrderList",
  "title": "订单列表页",
  "note": "v2版本，含搜索栏功能",
  "image_hash": "a1b2c3d4ef56",
  "image_source": "order-list-v2.png",
  "created_at": "2026-03-03T14:30:00.000Z",
  "schema": { "...": "完整 Schema 对象" },
  "yaml_text": "page_id: OrderList\n..."
}
```

> **团队建议**：将 `.factory/snapshots/` 目录纳入 Git 版本管理，让团队成员共享同一份"视觉记忆库"！

---

## 与 Agent 工作流集成

在 IDE 中（Cursor、Antigravity 等）使用 `/img2code` 指令时，工作流会**自动执行**快照预检：

1. 先调用 `vision snapshot list` 检查历史库
2. 发现精确匹配 → 跳过 AI，直接复用
3. 发现相似匹配 → 提示用户，合并差量
4. 无匹配 → 调用 AI，识别后自动入库

---

## SDK 集成（插件开发者）

如果你在开发独立的 npm 插件，可以直接调用快照 API：

```javascript
import { 
  saveSnapshot,
  listSnapshots,
  findByImageHash,
  findByKeyword,
  findSimilarSnapshots,
  findBestMatch
} from '@hnhok/fe-auto-factory/sdk'

// 识别前查库
const exact = findByImageHash('./mockups/login.png')
if (exact) {
  // 直接复用
  return exact.yaml_text
}

// 识别后入库
saveSnapshot({ imagePath, yamlText, schema, cwd, note: '登录页v3' })
```
