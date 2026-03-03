# 声明式无代码埋点系统 (Telemetry Tracker)

在传统的开发流水线里，前端完成业务开发后，往往还需要由专门的数据同学提供一份“打点(埋点)文档”。前端同学对着文档，像繁重的手工活一样在业务代码的 `click`、`submit` 回调里塞入形如 `Tracker.send('click_btn')` 之类的污染代码。这不仅让业务极度耦合，而且极易遗漏！

**在 `FE-Auto-Factory` 中，为了彻底释放产能，我们提出了基于属性抽象的“零代码自动采集埋点”。**

## 1. Schema 原生的埋点感知

当你建立一份 YAML 图纸时，只需要带上一个全局控制开关：

```yaml
page_id: OrderDashboard
# ...
features:
  track_clicks: true    # 开启这个模块的全部自动埋点监听
```

内核的生成驱动（特别是 `模板沙盒 Sandbox` 系统），在将 EJS 切片组装为 `.vue` 或 `.tsx` 文件时，会自动给这些页面上的核心交互元素挂载特有的结构符 `[data-track-id]`：

```html
<!-- 生成的结构里自动带有唯一的全局索引定位 -->
<button data-track-id="OrderDashboard-Btn-Query">查询</button>
<a data-track-id="OrderDashboard-Link-Detail">详情</a>
```

## 2. 声明式收集器 (Global Tracker)

我们的脚手架生态内包含了一个高度轻量化的埋点守护进程（你可以在初始化克隆来的模板项目的 `src/telemetry/tracker.ts` 看到）。

它通过在最顶级的 `document` 对象上代理一个全局的 **事件委托 (Event Delegation)**，并接管一切向上冒泡的用户动作：

```typescript
// 内部原理截取
document.body.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const trackId = target.getAttribute('data-track-id');
  
  if (trackId) {
    // 捕获成功！
    // 不仅拦截了节点，还抓取了节点里甚至可能存在的文本或额外状态
    sendToAnalytics({
       event_id: trackId,
       timestamp: Date.now(),
       path: window.location.pathname
    });
  }
}, true); // 捕获阶段，不怕业务 `stopPropagation`！
```

**就这么简单！没有任何业务侵入，也没有一行丑陋的发送代码埋在你的业务组件流里！**

## 3. 防遗漏：双重规则校验

万一你后期手工向组件里添加了一个至关重要的“购买”按钮，结果忘了加上它的打点属性怎么办？

不用担心，我们拥有 `03-development` 机器检查的最后一道防线：
引擎生成的项目配置体系中会携带 `rules/fe-factory-rules.js` 自定义 `ESLint` 插件。当你或者 CI 服务器运行 `npx fe-factory validate` 准备发版时：

这个自定义插件会自动分析您的 HTML / Vue 模板语法树，如果它检测到您拥有一个 `@click` 或者 `onClick` 事件绑定，但居然缺失对应的 `data-track-id` 声明时：将报出红色 Error 直接阻断你的编译和构建红线！

*这就是前端自动化的魅力，用生态而非人的意识去打磨极致的工业标准。*
