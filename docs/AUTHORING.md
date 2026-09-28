# MeowArch 文档系统使用指南

> 内容驱动的静态文档站。改 `docs/content/*.mdx` → 跑生成脚本 → 输出静态 HTML/JS。
>
> **⚠️ 永远不要手改 `docs/**/*.html` 或 `docs/docs-i18n.js`。** 它们是生成产物，
> 下一次 `node scripts/gen-docs.mjs` 会把手改覆盖掉。要改内容，只动 `docs/content/*.mdx`。

## 目录

- [心智模型](#心智模型)
- [日常操作](#日常操作)
- [Frontmatter 字段](#frontmatter-字段)
- [阅读顺序与上下页](#阅读顺序与上下页)
- [MDX / Markdown 能写什么](#mdx--markdown-能写什么)
- [扩展分区与图标](#扩展分区与图标)
- [i18n（双语）机制](#i18n双语机制)
- [构建 / 测试 / 预览命令](#构建--测试--预览命令)
- [文件速查](#文件速查)

## 心智模型

唯一真源是 `docs/content/<slug>.<lang>.mdx`。每篇文档一对文件
（`<slug>.en.mdx` + `<slug>.zh-CN.mdx`），文件顶部的 frontmatter 驱动**一切**：
侧边栏、阅读顺序、上/下页、首页卡片、`<title>`、双语文案。

```text
docs/content/*.mdx  ──(node scripts/gen-docs.mjs)──►  docs/index.html
   （手写，真源）                                       docs/guide/*.html
                                                       docs/download.html
                                                       docs/docs-i18n.js       （生成，勿改）
                                                       docs/docs-manifest.json （生成）
```

正文**不在生成时渲染**——浏览器里 `docs/docs.js` 按当前语言 fetch 对应的 `.mdx`，
用 `docs/mdx.js` 就地渲染成 HTML。这样**切换语言永不刷新页面**
（沿用 `meowarch:langchange` 机制）。所有文档级文案都是运行时可解析的 `data-i18n` 键，
由生成的 `docs-i18n.js` 提供，切语言时随全局 i18n 一起本地化。

## 日常操作

### ① 新增一篇文档（最常见）

丢两个语言文件 + 跑脚本，仅此而已：

```bash
# 1. 建两个语言版本，写好 frontmatter + 正文
#    docs/content/tips.en.mdx
#    docs/content/tips.zh-CN.mdx
# 2. 生成
node scripts/gen-docs.mjs
```

侧边栏、首页卡片、上/下页链会自动接好，无需手动改任何 HTML 或 i18n 文件。

### ② 修改现有文档

编辑 `docs/content/<slug>.{en,zh-CN}.mdx`：

- 只改**正文**：可以不跑脚本，浏览器是实时 fetch mdx 的（刷新页面即可看到）。
- 改了 **frontmatter**（标题 / 描述 / 顺序 / 图标等）：必须重跑
  `node scripts/gen-docs.mjs`，让页面壳、侧栏、卡片、`docs-i18n.js` 同步。

### ③ 本地预览

```bash
python3 -m http.server 5500
# 打开 http://127.0.0.1:5500/docs/index.html
```

或直接用 VS Code Live Server（端口 5500）。

## Frontmatter 字段

平铺 `key: value`，布尔 / 整数自动强转。示例见 `docs/content/install.en.mdx`。

| 字段 | 必填 | 默认 | 作用 |
|---|:--:|---|---|
| `title` | ✓ | — | 侧栏 / 卡片 / `<title>` / 上下页显示名 |
| `description` | ✓ | — | 首页卡片副标题 + `<meta name="description">` |
| `section` | ✓ | — | 分组，取值见 SECTIONS（`guide` / `downloads`） |
| `order` | ✓ | — | 组内排序 → 决定全局阅读顺序 → 推导上/下页 |
| `slug` | | 文件名 | 输出文件名 + i18n 键名 |
| `icon` | | `code` | 首页卡片图标，取值见 ICONS |
| `landing` | | `true` | `false` = 不出现在首页卡片 |
| `sidebar` | | `true` | `false` = 不出现在侧边栏（但仍在阅读链里） |
| `apiPanel` | | `false` | `true` = 正文**上方**烘焙“实时构建”面板；`inline` = 只加载 api 脚本、面板位置由正文里的 `:::api-latest` 决定 |
| `pageActions` | | `true` | `false` = 隐藏标题下方的“复制 Markdown / 打开 ▾”工具条 |
| `prevHref` / `prevTitle` | | 自动 | 覆盖自动算出的上一页 |
| `nextHref` / `nextTitle` | | 自动 | 覆盖自动算出的下一页 |

`icon` 可选值：`code`、`download`、`help`、`device`。

一个完整示例（`docs/content/install.en.mdx` 顶部）：

```yaml
---
title: Installation
description: Partitions, users, bootloader — the full walkthrough.
section: guide
order: 2
icon: download
prevHref: getting-started.html
prevTitle: Getting started
nextHref: faq.html
nextTitle: FAQ
---
```

## 阅读顺序与上下页

全局阅读顺序 = **先按 SECTIONS 里 section 的登记次序，再按组内 `order`**。当前顺序：

1. getting-started（guide, 1）
2. install（guide, 2）
3. faq（guide, 3）
4. download（downloads, 1）

上/下页由这条链自动推导。若要指向链外页面（比如 download 的“下一页”回到文档首页），
用 `prevHref/prevTitle/nextHref/nextTitle` 覆盖即可，生成器会为链外目标自动铸造
`docs.pager.<slug>.<方向>` 的 i18n 键；指向链内文档的覆盖则复用该文档已有的
`docs.item.<slug>.title` 键。

## MDX / Markdown 能写什么

`docs/mdx.js` 支持全量富 Markdown + 一组组件指令：

- **文本**：`**粗**`、`*斜*`、`` `行内代码` ``、`~~删除线~~`、`[链接](url)`、
  `<url>` 与裸链接自动成链、`![图](url)`
- **标题** h1–h6：自动生成 slug id + 悬停锚点；h1 后的首段自动成为 `.prose-lede` 导语
- **列表**：有序 / 无序、缩进嵌套、`- [x]` / `- [ ]` 任务清单
- **表格**：分隔行 `| :-- | :-: | --: |` 控制左 / 中 / 右对齐
- **引用块** `>`（可嵌套）、分隔线 `---`、脚注 `[^1]` + `[^1]: 定义`
- **代码块**：
  - ` ```term ` 或裸 ` ``` `：终端外观（`❯` 提示符高亮、`#` 注释变暗）
  - ` ```json ` / ` ```bash ` 等：输出 `<pre><code class="language-*">`，浏览器端由
    vendored highlight.js 上色（内置 bash/json/js/python/rust/yaml/diff/ini 等）

- **组件指令** `:::`：

  ```text
  :::tip 标题          （还有 note / warning / danger / info）
  内容
  :::

  :::tabs
  === 标签一
  面板一内容
  === 标签二
  面板二内容
  :::

  :::details 摘要文字
  折叠内容
  :::

  :::card 卡片标题 | href: ../somewhere.html
  :::

  :::cards cols: 2                （卡片网格：图标 + 标题 + 描述）
  :::card 安装 | href: install.html | icon: download
  分区、用户、引导器的完整流程。
  :::
  :::card 常见问题 | href: faq.html | icon: help
  遇到问题先看这里。
  :::
  :::

  :::steps                        （同 :::cards，但自动编号 1. 2. 3.）
  :::card 部署实例 | icon: download
  先装好实例。
  :::
  :::card 配置渠道 | icon: code
  再接上渠道。
  :::
  :::

  :::api-latest                   （在此处内联“实时构建”面板）
  :::
  ```

- **`:::cards` / `:::steps`**：内部放若干 `:::card 标题 | href: … | icon: …`（`href`、
  `icon` 均可选；正文作为描述）。`cols: N`（1–4）指定列数，缺省按卡片数选 2 或 3。
  `:::steps` 会给每张卡片标题前加 `1.` `2.` …。`icon` 取值同 frontmatter（`code` /
  `download` / `help` / `device`）。注意：**独立**的 `:::card` 仍是纯链接卡片，忽略图标与正文；
  只有嵌在 `:::cards` / `:::steps` 里的 `:::card` 才渲染图标 + 描述。
- **`:::api-latest`**：在正文任意位置内联“实时构建”面板。需要 frontmatter 设
  `apiPanel: inline`（加载 api 脚本但不在顶部烘焙面板），面板即出现在 `:::api-latest`
  所在处；`apiPanel: true` 则保持在正文上方的固定位置。

**页面工具条**：每页标题 / 导语下方自动出现“复制 Markdown / 打开 ▾”工具条（复制当前
语言的 `.mdx` 源、或在原文 / ChatGPT / Claude 中打开）。用 frontmatter `pageActions: false`
可逐页关闭。

**安全约定**：正文里的裸 HTML 一律被转义、**不透传**；`javascript:` / `data:` /
`vbscript:` 等危险 URL 在链接和图片上都会被中和。这是刻意为之（防 XSS），也是相对
“完整 GFM 透传裸 HTML”的有意偏离。

## 扩展分区与图标

这两项是**生成器配置**（不是 frontmatter），都在 `scripts/gen-docs.mjs` 顶部：

- **加新分区**：在 `SECTIONS` 里加一项，如
  `advanced: { dir: "advanced/", label: "docs.advanced", labelEn: "Advanced" }`，
  并在 `js/i18n.js` 补 `docs.advanced` 的中英文标签。
- **加新图标**：在 `ICONS` 里加 `key: '<path .../>'`（只写 SVG 内层节点），
  frontmatter 的 `icon` 即可引用。

## i18n（双语）机制

- 每篇文档的 `title` / `description` 会生成 `docs.item.<slug>.title` / `.desc` / `.tab`
  三个键（`.tab` = 标题 + “ · MeowArch Docs” / “ · MeowArch 文档”），写进
  `docs/docs-i18n.js`。
- `docs-i18n.js` 设置 `window.MEOWARCH_DOCS_I18N = { en, "zh-CN" }`，**在 `js/i18n.js`
  之前**加载；`i18n.js` 用 `Object.assign` 把它折入自己的字典。
- 站点框架（导航、页脚、按钮等）的键**留在 `js/i18n.js`** 里手工维护，不进 frontmatter。

所以：文档标题 / 描述改中英文 → 改 mdx frontmatter；导航 / 页脚等框架文案 → 改 `js/i18n.js`。

## 构建 / 测试 / 预览命令

```bash
node scripts/gen-docs.mjs      # 生成全部页面（幂等：连跑两次产物字节一致）
node /tmp/meow_test.js         # 渲染器测试（mdx.js，203 绿）
node /tmp/meow_gen_test.mjs    # 生成器测试（gen-docs.mjs，82 绿）
python3 -m http.server 5500    # 本地预览 → http://127.0.0.1:5500/docs/index.html
```

> 两个测试脚本目前放在 `/tmp/`，换机器可能需要从仓库或历史记录里重建。

## 文件速查

| 路径 | 手写 / 生成 | 说明 |
|---|:--:|---|
| `docs/content/*.mdx` | ✍️ 手写 | **真源**：内容 + frontmatter |
| `scripts/gen-docs.mjs` | ✍️ 手写 | 生成器（含 SECTIONS / ICONS 注册表） |
| `docs/mdx.js` | ✍️ 手写 | Markdown → HTML 渲染器（纯字符串，可 Node 测试） |
| `docs/docs.js` | ✍️ 手写 | 运行时：fetch mdx、渲染、高亮、复制按钮、实时 API 面板 |
| `docs/docs.css` | ✍️ 手写 | 文档样式 |
| `js/i18n.js` | ✍️ 手写 | 框架级 i18n 字典 + 合并钩子 |
| `docs/*.html`、`docs/guide/*.html` | 🤖 生成 | **勿手改** |
| `docs/docs-i18n.js` | 🤖 生成 | **勿手改**：文档级双语字典 |
| `docs/docs-manifest.json` | 🤖 生成 | 构建 / 测试产物，运行时不需要 |

---

**一句话总结**：改文档 = 编辑 `docs/content/*.mdx` → 跑 `node scripts/gen-docs.mjs`；
永远别手改 `docs/**/*.html` 和 `docs/docs-i18n.js`。
