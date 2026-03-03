# 数据模型中台与智能 Mock 引擎

在大型前端业务开发中，最痛苦的问题之一就是**类型碎片化**。A 页面定义了一个 `UserInfo`，B 页面又定义了一个 `UserDetail`，由于前后端沟通偏差，同一个实体在前端散落成几十块毫无关系的接口碎片。而且联调前手工编写假数据（Mock）也十分头疼。

`FE-Auto-Factory` 是如何通过中台化的设计思路在一开始就抹平这些痛点的？

## 1. 全局模型共享池 (Global Model Pool)

从 `v2.6` 开始，引擎引入了存放于 `[ProjectRoot]/.factory/models/` 下的全局组件模型抽象库。

在传统的局部生成中，每个 `Schema.yaml` 内的 `models` 字段只会生成在自己页面的范围内。但这显然不够，如果你有个公共的响应外壳 `BaseResponse`。

我们允许您在 `.factory/models/common.yaml` 里定义它：
```yaml
BaseResponse:
  code: number
  msg: string
  data: any
```

当你在业务视图的 `OrderList.schema.yaml` 里需要它时，完全不需要复制：
```yaml
models:
  # 直接利用 JSON Schema 的指针引用规范，引擎会自动去全局池寻址并缝合该类型！
  $ref: '#/definitions/BaseResponse'
  
  OrderSummary:
    id: string
    title: string
```
**这种架构彻底终结了前端接口的孤岛问题！** 它让前端拥有了类似后端 Java 中统一 `Entity / DTO` 的实体管理能力。这也为全端 BFF 转型奠定了类型基础。

## 2. 智能隔离 Mock 引擎

当我们拿着 Schema 生成了一个包含 `queryOrderList` 的 API Hook 后，接口往往并没有 ready。以前大家需要手工去写 mock 或者用第三方平台拦截。

如今，生成引擎里的 **“Smart Mocking”** 适配器会在页面落地的同时，为你在 `mocks/`（基于 Vite 的常见 mock 插件架构）目录下产出一份与你的 Model 严丝合缝的静态或者动态 Mock 脚本：

```typescript
// 引擎自动利用你定义的 OrderSummary 中的字段名字和类型猜测，
// 并组装为基于 faker.js 或简单随机数的假人系统
import { MockMethod } from 'vite-plugin-mock';

export default [
  {
    url: '/api/order/list',
    method: 'get',
    response: () => {
      // 拥有与上面 BaseResponse 保持一致的数据结构！
      return {
        code: 200,
        msg: 'success',
        data: {
          id: 'Mock-String-xx',
          title: 'Mock-String-xx'
        },
      };
    },
  },
] as MockMethod[];
```

该模式在联调开启后可一键切除，不会像早期的直接侵入业务的假数据那样对生产代码带来一丝破坏。真正实现了“需求落地 -> 测试环境跑通 -> 坐等联调”的高度重叠式敏捷开发。
