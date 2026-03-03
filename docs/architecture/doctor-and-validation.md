# 自动化卫士：校验与质量把控 (Validation & Doctor)

在 `FE-Auto-Factory` 中，**代码合法性约束**与代码生成本身同等重要。这不仅依赖后置的 CI，还深植到执行引擎的每个环节中。

---

## 1. 结构化蓝图前置检查（Ajv）

引擎在加载任何 Schema 文件之前，首先通过 **Ajv**（工业级 JSON 验证引擎）进行安检。

约束规则定义在 `schemas/page.schema.json` 中，覆盖：

| 字段 | 规则 | 不合规结果 |
|-----|-----|---------|
| `page_id` | 必须 PascalCase（如 `OrderList`）| 退出码 `2`，拒绝生成 |
| `route` | 必须以 `/` 开头 | 退出码 `2` |
| `api_endpoints` | 必须 camelCase（如 `getOrderList`）| 退出码 `2` |
| `track` | 必须 kebab-case（如 `order-cancel-click`）| 退出码 `2` |
| `features` | **v3.4.0**：支持任意布尔 Feature Flag | 合法（开放扩展）|

```bash
# 手动执行全量 Schema 校验
npx fe-factory validate
```

---

## 2. 组件白名单校验（v3.4.0 重构）

`validate` 命令会对 Schema 中的 `components` 列表进行合规检查，确认组件是否在已知的白名单内。

**v3.4.0 变更**：白名单从代码中的硬编码迁移到独立的 `schemas/component-whitelist.json` 文件，按框架分组：

```json
{
  "vant": ["VanButton", "VanCell", "VanForm", "..."],
  "element-plus": ["ElButton", "ElTable", "ElForm", "..."],
  "antd": ["Button", "Table", "Form", "..."],
  "custom": ["DataTable", "StatusBadge", "..."]
}
```

**支持自定义追加**：在 `.factory/config.json` 的 `customComponents` 字段添加你的私有组件名，不会触发白名单警告：

```json
{
  "preset": "vue3-element-admin",
  "customComponents": ["CompanyHeader", "GlobalFooter", "BizTable"]
}
```

---

## 3. Factory Doctor 悬丝诊脉

```bash
npx fe-factory doctor
```

进行 3 阶段健康查体：

1. **基础设施探测**
   - `.factory/config.json` 是否存在？
   - `preset` 对应的驱动插件是否已安装或存在本地驱动文件？

2. **AST 切入点诊断**
   - `tsconfig.json` 的 `@/` alias 配置是否正确？
   - `router/index.ts` 中是否存在可作为根节点的 `routes` 数组？

3. **环境依赖预警**
   - 检查是否安装了所有必须的前置库（如 `ajv`、`ejs`、`ts-morph`）

---

## 4. 自定义 ESLint 规则集（v3.4.0 增强）

工厂在 `rules/fe-factory-rules.js` 中内置了 6 条生产级自定义规则，可在项目的 `eslint.config.js` 中引入：

```javascript
import feFactoryRules from '../fe-auto-factory/rules/fe-factory-rules.js'
```

| 规则 | 说明 | 严重级别 |
|-----|-----|:-------:|
| `no-magic-api-url` | 禁止硬编码 API 路径，必须用 Service 函数 | error |
| `require-data-track-id` | 可交互组件必须有 `data-track-id` | warn |
| `no-direct-store-mutation` | 禁止直接赋值修改 Pinia store | error |
| `require-async-error-handling` | API 调用函数必须有 try/catch | warn |
| `no-console-log-in-production` | 生产代码禁止 console.log（Auto-fix 注释）| warn |
| `factory-slot-integrity` ⭐ **v3.4.0** | `[FACTORY-HOOK-CUSTOM-START/END]` 必须成对出现 | error |

> **`factory-slot-integrity` 规则**说明：防止开发者手动编辑时无意中删除了 `START` 或 `END` 中的一个边界注释，导致下次 `generate` 时手写业务代码丢失。

---

## 5. 调试模式（v3.4.0 新增）

当生成过程出现问题时，使用 `DEBUG` 环境变量开启详细日志：

```bash
DEBUG=fe-factory:* npx fe-factory generate --schema schemas/pages/OrderList.schema.yaml
```

输出内容包含：
- 驱动加载的详细路径判断
- Schema 解析后的完整对象
- 每个文件的具体写入操作
- 异常时的完整堆栈
