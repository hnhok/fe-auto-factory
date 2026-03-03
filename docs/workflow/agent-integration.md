# IDE 与大模型智能体接驳 (Agent Workflows)

`FE-Auto-Factory` 原本就是一个为了自动化全流程而生的底座。如今这个平台已经原生支持了主流 IDE（像 Antigravity, Cursor 等）作为智能中枢直接挂载工作流 `Workflows` 的能力！这不是科幻，而是目前该开源工程**开箱即用**的核心特性！

## 1. 原生 `.agent/workflows` 体系结构

随便打开一个你的 `factory init` 出来的脚手架（或者是这套文档底部的 Git 仓库），你会看到项目最顶层躺着一个：
`.agent/workflows/`

它下面放满了如下的 `*.md` 宏定义：
- `init-project.md` (初始化新的 FE-Factory 前端项目)
- `generate-page.md` (从 Page Schema 生成完整页面代码)
- `run-tests.md` (运行全量自动化测试套件)
- `deploy.md` (生产部署与闭环 CI/CD 动作)
- `img2code.md` (从图片智能生成骨架)

这些不是给人类读的常规文本，这是赋予大型语言模型（LLM）能够在编辑器终端代替你敲击键盘做复杂逻辑分控的 **Prompt 协议接口**。

## 2. 怎么触发这套外挂魔法？（基于斜杠命令 /Slash）

如果你在工作电脑装有 Antigravity Editor 或类似的 Agent，当产品发给你一份草图甚至口述了一句话：“小伙子，给我给咱们的系统里补个页面，名字叫销售排行榜”。

过去：你得去项目里建文件，写 YAML。

现在，你只需要在对话框里敲下：
```text
/generate-page 产品让我在系统里做个销售排行版。要有翻页功能。里面是金额数字，销售员名称而已。
```

大模型收到这个特殊的 “Slash Command” 或者检测到意图被唤起后，它会主动执行 `.agent/workflows/generate-page.md` 文件里描述的套路动作框架：

1. AI 自己跑去你的 `schemas/pages` 里，写下符合我们系统 Ajv 规范的 `SaleRankList.schema.yaml`（因为这个 Agent 本来就懂这种 YAML 的设计哲学）。
2. AI 在后台向操作系统的 terminal 打字：`npx fe-factory generate --schema xxxx` 执行页面挂载！
3. AI 继续顺着工作流 `[// turbo-all]` 指令运行，检查 AST 安装，并汇报给你：

*“主人，销售排行版我已经挂进左面路由菜单里了。对应的接口我瞎蒙名字叫做 `getSaleRanks` 帮您插到了 `useSaleRankList.ts` 里，请过目。”* 🎉

## 3. 把“视觉模型 (Vision)”跟工厂挂轨的无敌组合

前面我们提过 `npx fe-factory vision` 在命令行的不便利性。现在利用 `.agent` 工作流能将它完美放大：

你丢给你的编辑器一张截图。
并在上面加上斜杠工作流名宏：
```text
/img2code 这是一张移动端详情页的照片，照此开发
```
编辑器背后的 GPT-4o 或 Kimi Vision 模型会直接代替原本靠脚本调用的视觉 API 操作它自己的推敲分析。将识别到的元素字段转化为精确的 `yaml` 后。紧接着触发上面的工厂挂载闭环。

**这一切，让你彻底脱离了前端民工体力切图的角色，化身拥有千军万马的代码架构布道师。**
