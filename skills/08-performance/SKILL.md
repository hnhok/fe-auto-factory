---
name: performance-guard
description: >
  专项 Skill 08：性能基准与优化规范。建立以 Lighthouse CI 为核心的性能卡点，
  结合首屏加载优化、包体积分析、图片懒加载等前端性能最佳实践，
  确保每次上线的业务页面均达到性能标准门槛。
triggers:
  - "执行 CI/CD 上线流水线时"
  - "Lighthouse 分数低于阈值告警时"
  - "工厂生成新页面后，开发者进行自测前"
  - "执行 npx fe-factory test --perf 命令时"
---

# ⚡ Skill 08 — 性能基准与优化规范 (Performance Guard)

## 目标
**每一个工厂生成并上线的页面，必须满足性能指标的最低门槛**。
通过在 CI 流水线接入 Lighthouse CI 和 Vite 包体积分析，
将性能问题扼杀在合并主干之前，而非在生产事故后才被发现。

## 前提条件
- 项目已集成 Vite 或 Webpack 构建工具
- CI 环境安装了 `@lhci/cli`（Lighthouse CI 命令行工具）

## 涉及工具链
- `lighthouserc.json` — 性能断言阈值配置
- `@lhci/cli` — Lighthouse CI 自动化采集
- `vite-bundle-visualizer` / `rollup-plugin-visualizer` — 包体积分析
- `scripts/factory.js test --perf` — 触发性能测试

---

## 步骤一：核心性能指标门槛 (SLA)

工厂项目的所有上线页面必须达到以下标准：

| 指标 | H5 移动端 | Admin PC 端 | 工具 |
|-----|---------|-----------|-----|
| **Lighthouse Performance Score** | ≥ 80 | ≥ 85 | LH CI |
| **FCP（首次内容绘制）** | ≤ 2.5s | ≤ 2.0s | LH CI |
| **LCP（最大内容绘制）** | ≤ 3.0s | ≤ 2.5s | LH CI |
| **TBT（总阻塞时间）** | ≤ 500ms | ≤ 300ms | LH CI |
| **CLS（累积布局偏移）** | ≤ 0.1 | ≤ 0.05 | LH CI |
| **首屏 JS 总体积** | ≤ 400KB | ≤ 600KB | Bundle Analyzer |

---

## 步骤二：Lighthouse CI 配置标准

在项目根目录创建 `lighthouserc.json`：

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.80 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 3000 }],
        "total-blocking-time": ["error", { "maxNumericValue": 500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.10 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

在 GitHub Actions 中接入：

```yaml
# .github/workflows/lighthouse.yml
- name: Build Preview
  run: npm run build && npm run preview &

- name: Run Lighthouse CI
  run: npx lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## 步骤三：前端性能优化清单

每个工厂生成的页面在上线前，开发者必须按以下清单执行一次自查：

### 3.1 资源加载
- [ ] 所有图片已通过 `v-lazy` 或 `loading="lazy"` 启用懒加载
- [ ] 首屏不可见的图片未在 HTML 中提前加载（无 eager preload）
- [ ] 页面 `.vue` 没有引入超过 3 个未使用的第三方库

### 3.2 路由与代码分割
- [ ] 本页面的路由是**动态 import**（`component: () => import(...)`）
- [ ] 不在页面入口文件顶层 `import` 某一次性重型库（如 ECharts 全量）

### 3.3 渲染性能
- [ ] `v-for` 列表超过 50 条目时，使用虚拟滚动（`VanList` 或 `el-table` 虚拟模式）
- [ ] 图片资源宽度与展示尺寸匹配（不使用 4K 图缩小成 50px 显示）
- [ ] 不在 `setup()` 内进行高频同步运算（计算量大的逻辑用 `computed` 缓存）

### 3.4 Vite 构建优化
- [ ] `vite.config.ts` 中配置了 `build.rollupOptions.output.manualChunks` 合理拆包
- [ ] ElementPlus / Vant 启用了按需自动引入（`vite-plugin-components` 或 `unplugin-auto-import`）

---

## 步骤四：包体积诊断命令

```bash
# 生成可视化包体积分析报告（会打开浏览器）
npm run build -- --mode analyze

# 查看各chunk大小分布（不需要浏览器）
npx vite-bundle-analyzer dist/
```

---

## 步骤五：性能数据归档

每次 CD 触发后，性能指标应写入工程的历史档案：

```
telemetry/perf-history.json
```

格式参考：
```json
[
  {
    "date": "2026-03-03",
    "page": "OrderList",
    "fcp": 1820,
    "lcp": 2100,
    "tbt": 180,
    "score": 91
  }
]
```

---

## ✅ 阶段完成标志

- [ ] `lhci autorun` 全部断言通过（无 error）
- [ ] 首屏 JS bundle 总体积 ≤ 阈值
- [ ] 3.1 ~ 3.4 自查清单全部划勾
- [ ] 性能数据已写入 `telemetry/perf-history.json`

## 📂 产出物

```
lighthouserc.json                    ← Lighthouse 阈值配置
telemetry/perf-history.json         ← 性能历史档案（持续追加）
dist/stats.html                     ← 包体积分析报告（构建产物）
```
