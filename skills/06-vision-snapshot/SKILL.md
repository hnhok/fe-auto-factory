---
name: vision-snapshot
description: >
  专项 Skill 06：视觉快照积累策略。当识别设计稿/原型图时，先查询历史快照库，
  精确命中直接复用，语义相似则合并差量，完全新图才调用 AI 识别，
  识别结果自动存入快照库供后续复用。
triggers:
  - "执行 vision 命令 / /img2code 工作流时"
  - "用户上传设计稿或原型图稿要求还原页面"
  - "重复性相似 UI 模式（如列表页、详情页）的生成需求"
---

# 📸 Skill 06 — 视觉快照积累与复用 (Vision Snapshot)

## 目标
**让每一次 AI 视觉识别的结果成为沉淀资产**，而非单次消耗资源。
历史识别的设计稿相关信息在未来的相似图片中可以零成本复用。

## 前提条件
- 已在 `.factory/config.json` 中配置了正确的 `preset`
- 如需 AI 识别，已设置环境变量 `VLM_API_KEY`

## 涉及工具链
- `scripts/vision.js` — 视觉识别主入口
- `scripts/snapshot/store.js` — 快照持久化（读/写/删）
- `scripts/snapshot/matcher.js` — Jaccard 相似度匹配引擎
- `.factory/snapshots/*.json` — 快照存储目录（自动创建，建议纳入版本库）

---

## 步骤一：理解三层过滤机制

执行 `npx fe-factory vision <image>` 时，引擎按优先级依次进入下列判断通道：

### 通道 A — 精确命中 (MD5 哈希匹配)
```
同一张图片 → MD5 哈希相同 → 直接复用历史 Schema → 0 AI 消耗
```
适用场景：同一张设计稿被多名开发者反复拿来生成不同页面，或分支合并时重复触发。

### 通道 B — 语义相似 (Jaccard ≥ 45%)
```
相似 UI 结构 → 组件/接口/特性重合度 ≥ 45% → 提示开发者 → 自动合并增量信息
```
匹配权重：
| 维度 | 字段 | 权重 |
|-----|-----|-----|
| 组件重合度 | `components` | 50% |
| 接口重合度 | `api_endpoints` | 30% |
| 特性开关重合度 | `features` | 20% |

### 通道 C — 全新识别
```
无历史匹配 → 调用视觉大模型 → 识别结果自动入库
```

---

## 步骤二：常用命令速查

```bash
# 识别图片（自动查库 → 入库 → 生成代码）
npx fe-factory vision mockups/order-list.png

# 强制重识别（忽略已有快照）
npx fe-factory vision mockups/order-list.png --force

# 为识别结果添加备注（方便后续检索）
npx fe-factory vision mockups/order-list.png --note "订单列表v2版本-加了搜索栏"

# 查看当前项目所有历史快照
npx fe-factory vision snapshot list

# 删除特定快照（ID 从 list 命令得到）
npx fe-factory vision snapshot delete OrderList-abc123def
```

---

## 步骤三：快照数据结构说明

快照存放在 `.factory/snapshots/[PageId]-[hash].json`，结构如下：

```json
{
  "id": "OrderList-a1b2c3d4ef56",
  "page_id": "OrderList",
  "title": "订单列表页",
  "note": "v2版本，含搜索栏功能",
  "image_hash": "a1b2c3d4ef56",
  "image_source": "order-list-v2.png",
  "created_at": "2026-03-03T14:30:00.000Z",
  "schema": {
    "page_id": "OrderList",
    "components": ["VanNavBar", "OrderStatusTag"],
    "api_endpoints": ["getOrderList"],
    "features": { "pagination": true, "search_bar": true }
  },
  "yaml_text": "page_id: OrderList\n..."
}
```

**注意：快照文件应纳入 Git 版本管理**，这样团队成员共享同一份"视觉记忆库"，避免同一设计稿在不同人手中重复消耗 AI Token。

---

## 步骤四：SDK 扩展接入

如果你在开发独立的 npm Plugin 驱动，也可以直接调用引擎暴露的快照 API：

```javascript
import { 
  saveSnapshot,
  findByImageHash,
  findSimilarSnapshots 
} from '@hnhok/fe-auto-factory/sdk'

// 在插件的识别流程结束后入库
await saveSnapshot({ imagePath, yamlText, schema, cwd, note: '特殊定制驱动识别' })

// 在插件开始识别前先查库
const exact = findByImageHash(imagePath, cwd)
if (exact) {
  // 直接复用，不调用 AI
}
```

---

## ✅ 阶段完成标志

- [ ] 执行 `vision snapshot list` 能看到累积的历史快照
- [ ] 相同图片二次识别时控制台输出了 `⚡ 发现完全相同的图片快照！` 提示
- [ ] 类似图片识别时控制台输出了 `🔍 发现 N 条相似历史快照！` 并进行了合并
- [ ] `.factory/snapshots/` 目录纳入了团队 Git 仓库

## 📂 产出物

```
.factory/snapshots/[PageId]-[hash].json  ← 快照数据文件
schemas/pages/[PageId].schema.yaml       ← 生成的 Schema 图纸（标准输出）
```
