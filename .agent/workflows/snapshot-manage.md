---
description: 管理视觉快照库（列举、搜索、删除历史设计稿快照）
---

# /snapshot-manage — 视觉快照库管理工作流

当用户需要查询、整理或删除历史设计稿快照时触发此工作流。

---

## 步骤 1：列举所有历史快照

// turbo
```bash
npx fe-factory vision snapshot list
```

输出所有快照的 `page_id`、`title`、图片来源、入库时间和 ID。

---

## 步骤 2：根据用户意图执行对应操作

### 场景 A — 用户想"搜索"某种类型的快照
根据关键词在快照清单中查找：
```bash
node --input-type=module --eval "
import { findByKeyword } from './scripts/snapshot/store.js'
const results = findByKeyword('<关键词>')
if (!results.length) { console.log('未找到匹配快照') }
else results.forEach(s => console.log(s.id, '-', s.title || s.page_id))
"
```

### 场景 B — 用户想"删除"某条快照
// turbo
```bash
npx fe-factory vision snapshot delete <快照ID>
```
> ID 从步骤 1 的 `list` 输出中获取。

### 场景 C — 用户想"复用"某条历史快照生成新页面
1. 从快照清单找到目标快照的 ID
2. 读取该快照的 YAML 内容：
```bash
node --input-type=module --eval "
import { listSnapshots } from './scripts/snapshot/store.js'
const snaps = listSnapshots()
const target = snaps.find(s => s.id === '<快照ID>')
if (target) console.log(target.yaml_text)
"
```
3. 将输出的 YAML 内容另存为新的 Schema 文件（修改 `page_id` 和 `route`）
4. 执行 `/generate-page` 工作流

### 场景 D — 用户想"查看相似快照"
```bash
node --input-type=module --eval "
import { findSimilarSnapshots } from './scripts/snapshot/matcher.js'
import { parseFrontmatter } from './scripts/utils/schema.js'
import { readFileSync } from 'fs'
const schema = parseFrontmatter(readFileSync('schemas/pages/<schema文件名>.schema.yaml', 'utf-8'))
const results = findSimilarSnapshots(schema)
results.forEach(r => console.log((r.score*100).toFixed(0) + '%', r.snapshot.page_id, r.snapshot.id))
"
```

---

## 步骤 3：汇报结果

向用户清晰汇报操作结果，并提示：
- 快照文件存储位置：`.factory/snapshots/`
- 建议将快照目录纳入 Git 版本管理（团队共享"视觉记忆库"）
- 若快照库已有 10 条以上，建议定期清理过时版本以保持整洁
