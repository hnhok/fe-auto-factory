# 5 分钟速通实战：点亮第一套增删改查页 (Tutorial)

这章不讲任何复杂的底层原理。只要你照着这 3 个最简单的动作，你就能亲自感受到 **1 秒代码生成成百上千行** 带来的极度快感，以及你在生成的代码里**手写自己逻辑还不会被覆盖**的魔法！

在这 5 分钟里，我们将为一家假想的公司搭建一个名为“**商品大盘管理 (`ProductManager`)**”的列表页。

---

## 步骤 1: 准备好你的“工厂机器”

首先找个干净的空文件夹打开你的命令行，我们借用官方开箱即用的 H5/Vant 或 Element 模板作为底座。

敲响发令枪（或选 `vue3-vant-h5` 作为实验栈）：
```bash
npx fe-factory init demo-shop
```
*(你可能会看到进度条在拉取云端模板，不用管，等它出现“初始化成功”即可)*

进入项目：
```bash
cd demo-shop
npm install
npm run dev
```

现在你的浏览器应该已经在 `localhost:5173` 跑起了一个干净但啥也没有的新骨架。

---

## 步骤 2: 给出一页简单的“图纸 (Schema)”

我们不需要你去写一行繁琐可恶的 `Interface`、`api.js` 和 `Table.vue`，这太累了。
打开你在上面创建的那个 `demo-shop` 项目目录。新建一个文件：
`schemas/pages/ProductManager.schema.yaml`

把你最直接的业务需求复制进去保存：

```yaml
page_id: ProductManager
title: 商品大盘管理
layout: default

features:
  pagination: true  # 自动搞出下拉刷新和翻页变量
  search_bar: true  # 自动给你弄个带筛选的表头

# 你只要把接口长什么样告诉系统就行，剩下的 TS 强推导我们全包了！  
models:
  ProductItem:
    id: number
    title: string
    price: string
    isSoldOut: boolean

api_endpoints:
  - queryProductList
  - updateProductPrice
```

---

## 步骤 3: 见证奇迹的时刻

打开命令行，对着你的这份图纸敲下这行最伟大的咒语：

```bash
npx fe-factory generate --schema schemas/pages/ProductManager.schema.yaml
```

**你会立刻在控制台看到像子弹一样的处理流：**
✅ 生成 src/views/ProductManager/index.vue ...
✅ 生成 src/views/ProductManager/hooks/useProductManager.ts ...
✅ 生成 src/api/product-manager.ts ...
✅ 正在智能 AST 解析注入你的主路由树...

此时你打开项目的 `src/router/index.ts` 会发现，系统非常克制地给你添加了这页的路由权限（丝毫没打乱你老祖宗的代码缩进格式）！
而去 `views/ProductManager/` 目录下一看，那些带生命周期、带泛型的请求 Hook 和 Vue 模板结构，全都干干净净地写好了！

---

## 步骤 4: 震惊你认知的人机结对与“防覆盖”实验 🚀

你可能有疑惑：“这和我以前用的代码生成器有什么区别？如果我现在改了文件，下次老板要我新加个接口，我一运行命令，我的手写代码不就被覆盖了吗？”

**绝对不会！为了验证这点，做个实验：**

1. 打开刚生成的 `src/views/ProductManager/hooks/useProductManager.ts`。
2. 找到代码里被 `// [FACTORY-HOOK-CUSTOM-START]` 和 `// [FACTORY-HOOK-CUSTOM-END]` 标记包围的空白处！
3. 用键盘手敲一个牛逼的方法进去（比如这是一个用来做神仙埋点的函数）：
   ```typescript
   // [FACTORY-HOOK-CUSTOM-START]
   const doSomeMagic = () => {
     console.log('老板我终于会写代码啦！')
   }
   // [FACTORY-HOOK-CUSTOM-END]
   ```
4. 别忘了在下面的 `return { ... }` 导出对象里加个 `doSomeMagic,` 导给外部。
5. 保存！

**接着，突然产品提出要加一个删除商品的 API！**
6. 去我们刚才说的 `ProductManager.schema.yaml`，在 `api_endpoints` 下头，悄摸加一个：
   `- deleteProduct` 
7. 再次跑一次大指令！
   ```bash
   npx fe-factory generate --schema schemas/pages/ProductManager.schema.yaml
   ```

**去看看你的那份 `useProductManager.ts`！**
你会震碎三观的发现：
由于内核强大的 **AST 全息热缝合算法**，刚才生成的不仅补齐了带有泛型的 `deleteProduct` 调用，而且你**手写的那个包袱里的 `doSomeMagic` 和最后修改的导出，毫发无损地被留存缝合在了这个新环境里！**

就这 5 分钟！
你已经省去了你一下午寻找变量对齐接口的功夫，并且还完成了 0 损失的业务无差别增量迭代！可以关掉这个教程正式上班了。
