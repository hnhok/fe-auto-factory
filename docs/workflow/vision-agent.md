# AI 视觉生成：从设计稿到业务骨架 (Vision Agent)

前端团队经常会有拿到直接是图片或者手绘稿，要最快拼装成 UI 的要求。
`fe-auto-factory` 不满足于仅仅是纯粹基于数据 Schema 的生成，我们在 `workflow/` 生态体系中结合了大模型的多模态推演能力，实现了：**端到端的从视觉输入直接倒推至 Schema 再利用脚手架生根的能力！**

## 如何唤起图像生成？ (CLI 原生模式)

不需要额外的配置大模型 API Key（除非你想要重写底层代码），当你成功 `init` 一套框架以后，你可以利用 CLI 唤起我们的 Vision 接口：

```bash
npx fe-factory vision
```

1. CLI 会提示你输入你想逆向工程解析的图片路径（如：`assets/mockups/mobile-login.png`）或外部一个公开的 UI 图标链接。
2. 然后，系统将会触发内置配置的多模态大模型（比如：Kimi Vision / GPT-4o）。
3. ✨ 大模型会根据它“看到”的截图上的组件、表格、或者是列表卡片，自动为你脑补出一份 `fe-auto-factory` 标准的 YAML Schema （包括假定的英文命名和类型结构）。
4. 拿到生成的 `schemas/pages/VisionParsed.yaml` 图纸后，CLI 会顺理成章且全自动地把它接入口传递给底层的驱动体系！
5. 在你的 src 目录里，所有的模板、CSS 布局、变量流将瞬间出现。这彻底打破了 `v0` 此流派生成器“生成的代码全是冗长意大利面条且没法二次结合 Vue/React 架构体系”的恶性循环！

## 如何结合工作流触发？ (IDE Workflow 模式)

在支持工作流驱动环境（比如你当前正在使用的 Antigravity 或者 Cursor 编辑器）下。
我们的项目根目录 `.agents/workflows/img2code.md` 甚至定义了完美的 IDE 指令。

当你给 AI 提供了一张截图时，可以在对话栏直接输入挂载宏：

```text
/img2code 这里有一张移动端登录页面的效果图。帮我把页面做出来挂载进去。
```

> **系统执行链**:
> 1. 大模型识别图片。
> 2. IDE AI Agent 开始调用系统环境下的 `touch schemas/pages/...yaml` (自己写 YAML)
> 3. AI 调用 CLI 的 `npx fe-factory generate --schema xxx` 替你跑完流程。
> 4. 全部自动化挂载！
