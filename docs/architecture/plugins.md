# 🧩 微内核与插件化生态 (Micro-kernel & Plugin Ecosystem)

## 架构演进背景 [v3.2.0]

随着企业和业务线规模的扩展，UI 框架和组件库日益多样化（Vue, React, Svelte；Ant Design, ElementPlus, Vant, Arco...）。
最初 `fe-auto-factory` 是将 `driver-xxxx.js` (渲染驱动引擎) 直接硬编码存放在核心库的 `scripts/generators` 目录内。

这种“巨石应用(Monolithic)”引发了两个阻碍点：
1. 第三方团队想要对接自研的内网 UI 库时，必须 `Fork` 整个 CLI 工程。
2. 随着驱动的增多，工厂体积日益臃肿。

为此，在版本 **v3.2.0** 中，我们实行了 **"工厂即内核" (Factory as a Micro-kernel)** 的重构，彻底拥抱松耦合插件化生态。

---

## 插件加载流转图

当你执行页面生成命令 \`fe-factory generate\` 时候，工厂引擎会对配置中的 \`preset\` 驱动（如：\`vue3-vant-h5\`）执行三级降级侦测：

1. **级别一：本地沙箱注入 (Local Sandbox)**
   - 搜寻当前业务工程下的 `.factory/drivers/driver-{preset}.js`
   - **适用场景**：某单独业务线临时写的一个特殊代码生成逻辑，不需要跨项目复用。

2. **级别二：npm 生态插件 (Micro-kernel Plugin) - 🌟首选🌟**
   - 尝试动态 \`import\` 命名空间包：\`@fe-factory/plugin-{preset}\`
   - **适用场景**：独立的 npm 仓库，团队共享资产。完全脱离 Factory 核心包。

3. **级别三：内置兼容驱动 (Legacy Built-in/Fallback)**
   - 退回匹配随 npm 携带的原生基础驱动 (\`scripts/generators/...\`)
   - 保证旧项目的无缝运转。

---

## 如何编写一款独立 npm 渲染插件？

现在，任何前端基础架构组，都可以轻松为各自公司研发自己的 UI 代码生成器，无需 Fork 发版核心工厂！

### 第一步：新建标准的 NPM 工程
推荐命名为：\`@my-org/plugin-react-antd\`，而在业务的 \`.factoryrc.json\` 中把 \`preset\` 填上 \`react-antd\`。

### 第二步：导入暴露的基建原子核 (The SDK)

不必从 0 到 1 自己拼凑文件。由于我们的合并逻辑、AST 保护逻辑都是高度复杂的，我们在核心库开放了 **SDK**。你可以直接在驱动中借用：

```javascript
/* driver 开发范例 */
import { 
  generateTypesFile, 
  generateStoreFile, 
  smartPatchHook,
  extractSection
} from '@hnhok/fe-auto-factory/sdk'

export async function generatePage(params) {
    const { page_id, config, models } = params
    
    // 1. 生成或利用 AST (smartPatchHook) 增量修补你的 React Hooks...
    
    // 2. 复用底层强大的基础资源生产引擎：
    generateTypesFile({ cwd: process.cwd(), config, page_id, models })
    generateStoreFile({ ...params })
}
```

### 第三步：发包并配置
发布插件到 npm 私服，确保团队在目标业务安装了该包，CLI 即可大发神威。
