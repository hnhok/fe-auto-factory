# 四大 Skill 阶段守卫 (Pipeline)

`fe-auto-factory` 的终极愿景不仅仅是写一个脚手架而已，它是一整套企业架构体系的缩影。

在项目根目录下，`skills/` 文件夹定义了从一个研发动作诞生到最终跑入生产的主链路标准。当你通过 `npx fe-factory` 的不同流派或者跑在自动化机器上时，我们实际上是串联了四个完全不同的 Skill 子系统！

## 阶段一：需求分析 (`01-requirements/`)

**核心目标：将散装的文字和口述 PRD，收敛成标准化的 Schema 图纸结构。**
在这个 Skill 系统中，我们不要求一定要用什么工具。但我们在生态中提倡一切以 `schemas/` 下的 `yaml`/`json` 文件为中心来源。它确保了：产品的想法最终落实在了对前端大盘来说完全可控且结构化的骨架里。

不管是你们通过 Swagger API 反推 (`sync`) 自动得到类型定义，还是通过 `Vision` 得到的大模型识别草图、又或者是人工按需写的结构大章。这是工厂系统唯一接驳上游系统的入口（单向数据流开始点）。

## 阶段二：自动化开发与编译 (`02-development/`)

**核心目标：根据 Schema 将重复的海滩泥沙构建出雄伟的架构大厦（UI/API/Store 等）。**
在这里，我们启用了强类型的校验机制：
- 大名鼎鼎的 `Ajv` `json-schema` 帮你校验传入引擎图纸的合法性（在 `schemas/page.schema.json` 中配置）。
- 调用 `generators/` 微内核执行插件渲染落地（包括 AST 的 `updateRouterSafely`，无损化路由插拔）。
- 并在执行后利用统一配置的 `eslint` 及 `prettier` (参见 `rules/fe-factory-rules.js`) 将大段手写代码重新排列得如丝般顺滑。这也是 `generate` 背后真正的全副武装。

## 阶段三：自动化代码质量与测试守卫 (`03-testing/`)

**核心目标：机器应该代替测试工程师和前端，去反复点开 UI 来看看数据流有没有崩。**
当图纸驱动了一座大楼盖好，我们不能祈祷它天然没有任何臭虫！

1. **自动单元测试 (Vitest)**: 我们在 SDK 生成 `hooks/useXXX.ts` (基于组件抽象的状态抽离) 时，也会一并为你生成好该 Hook 的黑盒测试壳或者桩点 (`Mock`)。
   
2. **端到端测试机制 (E2E-Playwright)**: 这是我们的绝杀武器能力！在生成界面资产的末端，内核也会顺势为你生成 `tests/e2e/xxx.spec.ts` 文件。系统默认注入基于你的 `models` 与 `api_endpoints` 的 playwright 断言环境（例如：如果你启用了 `search_bar`，生成的 E2E 就会自动包含“检查并输入检索元素”的事件脚本）。
   
你可以直接利用命令对业务组件进行防重构的坚固性验证：
```bash
npx fe-factory test
# 或
npx fe-factory validate
```

## 阶段四：投产与数据闭环监控 (`04-deployment/`)

**核心目标：部署的完成绝不是前端流程的终结，相反它是数据分析和下一次优化的开始。**

在这里包含但不局限于 CI/CD 机器人的工作流定义（位于 `tests/ci.yml` 等生态链路）:
- 触发基于工厂体系里生成的 Lighthouse 性能跑分基点。
- 在 `Schema` 开启了 `track_clicks: true` 开关下，我们的 SDK 在产出 `template` 时已全量覆盖和注入了 `[data-track-id=xxx]` 的 `telemetry` (埋点信息)，这就为第四阶段生产环境的埋点日志投递提供了完美的数据支持。
- Sentry 等崩溃平台的异常将会顺着这些被规矩生成的资产返回到数据看板上，触发下一次需求的更新重启。
