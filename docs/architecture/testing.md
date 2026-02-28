# 自动化质量保证与 CI 测试防御

## Unit & e2e 并行生成
当我们跑动 `factory generate` 去渲染你的 Schema 的时候，其伴随产物并不仅仅只有运行所需的业务。更包含被隐匿写好的自动化测试防御代码（`*.spec.ts`）。

我们针对 `Playwright` 自动化 Web-e2e 端对端测试实现了 Schema-driven 化：
* 脚手架会自动检索你的接口列表与埋点定义列表。
* 并在你的测试文件内初始化 `test('', async({page})=>{ ... })` 单元及断言。

## Linter & Schema Linter
在团队想要提交代码前。通常运行：
```bash
npx fe-factory
> 选择 [✅ 运行全量质量检查]
```

这不仅执行常春藤的 `tsc / eslint` 工具；更为关键的是引入我们自有的**强 Schema 规则审查（Ajv）**，一旦不一致，将会主动在远端拦截该代码避免混入业务项目的主分支！
