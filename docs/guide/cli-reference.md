# FE-Auto-Factory 命令参考速查表 (CLI Reference)

本章节收录了通过 `npx fe-factory` 直接驱动引擎的所有可用命令及参数（v3.4.0 更新）。

---

## 全局唤醒 (Interactive UI)

```bash
npx fe-factory
```
不带任何子命令时，唤起交互式控制台菜单，提供全套生成向导，新人最推荐的方式。

---

## 1. 🏗️ 初始化架构基座

```bash
npx fe-factory init [project-name]
```
从官方云端矩阵拉取隔离架构分支，在当前目录下创建 `project-name` 目录，打上 `.factory/config.json` 血统烙印。

---

## 2. ⚡ Schema 图纸执行生成渲染

```bash
npx fe-factory generate --schema <path_to_yaml>
```

| 参数 | 说明 |
|-----|-----|
| `--schema <path>` | 指向 YAML 图纸文件路径（必填）|

**执行流程：**
1. Ajv 校验 YAML 格式（异常退出码 `2`，而非通用 `1`）
2. 读取 `.factory/config.json` 的 `preset`
3. **♻️ 组件复用检测**（v3.4.0 新增）：扫描全项目，已有组件直接复用
4. 执行驱动渲染 + AST 无损增量合并
5. 注入路由、输出 E2E 测试代码

> 重新执行已生成过的页面是安全的：`[FACTORY-HOOK-CUSTOM-START]` 槽位内的手写代码绝不被覆盖。

---

## 3. 👁️ 视觉识别建站（含快照复用）

```bash
npx fe-factory vision <image-path> [--force] [--note "备注"]
```

**v3.4.0 重大升级**，加入三重过滤通道：

| 参数 | 说明 |
|-----|-----|
| `<image-path>` | 设计稿/原型图的本地文件路径（必填）|
| `--force` | 忽略快照库，强制重新调用 AI 识别 |
| `--note "..."` | 为本次识别结果添加备注，方便后续检索 |

**执行逻辑：**
```
图片输入 → MD5 精确命中？→ 是：直接复用（0 Token）
          ↓ 否
          Jaccard 相似度 ≥ 45%？→ 是：合并差量
          ↓ 否
          调用 AI 视觉模型 → 识别 → 生成 Schema → 自动入库 → generate
```

### 快照管理子命令

```bash
# 查看所有历史快照
npx fe-factory vision snapshot list

# 删除指定快照（ID 从 list 命令获取）
npx fe-factory vision snapshot delete <snapshot-id>
```

---

## 4. 🔄 Swagger 接口反向同步

```bash
npx fe-factory sync --swagger <api_docs_url> [--extract <module>]
```

| 参数 | 说明 |
|-----|-----|
| `--swagger <url>` | 后端 OpenAPI 3.0/2.0 JSON 地址 |
| `--extract <module>` | 指定业务分类（如 `Auth`、`OrderCenter`），直接生成 Schema 草图 |

---

## 5. 🏥 环境健康检查

```bash
npx fe-factory doctor    # 项目环境诊断（驱动、alias、依赖）
npx fe-factory validate  # Schema + ESLint 代码规范检查
npx fe-factory test      # 触发 Playwright E2E + Vitest 单元测试
```

**`validate` v3.4.0 更新**：组件白名单从外部 `schemas/component-whitelist.json` 加载，支持多预设（vant / element-plus / antd）。

---

## 6. ⬆️ 架构升级

```bash
npx fe-factory update
```
自动拉取最新的驱动插件和依赖定义，生成本次拉平的 CHANGELOG 流水。

---

## 🏷️ 退出码说明（v3.4.0 新增）

| 退出码 | 含义 | CI 处理建议 |
|:-----:|-----|-----------|
| `0` | 成功 | 继续后续步骤 |
| `1` | 通用错误 | 查看错误信息 |
| `2` | Schema 格式错误 | 可自动修复后重试 |
| `3` | 驱动缺失 | 安装对应 npm 插件 |
| `4` | 驱动执行崩溃 | 需人工介入，开启 DEBUG |

```bash
# 开启详细调试日志（排障专用）
DEBUG=fe-factory:* npx fe-factory generate --schema xxx
```

---

## 快捷 npm 脚本

项目 `package.json` 内置以下快捷命令：

```bash
npm run factory                 # 交互式菜单
npm run factory:generate        # 生成
npm run factory:validate        # 验证
npm run factory:doctor          # 诊断
npm run factory:vision          # 视觉识别
npm run factory:snapshot:list   # 查看快照库
npm run docs:dev                # 启动文档站
```

---

*所有命令的实现封装在 `scripts/commands/` 下，插件开发者可通过 `@hnhok/fe-auto-factory/sdk` 直接调用底层 API。*
