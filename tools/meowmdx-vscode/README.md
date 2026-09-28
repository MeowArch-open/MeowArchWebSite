# MeowArch MDX — VS Code 扩展（精简版）

为 MeowArch 文档站自定义的**精简 MDX 方言**提供 VS Code 语言支持。这套 `.mdx`
**不是标准 MDX**：没有 JSX，由 `docs/mdx.js` 这个纯字符串渲染器处理。官方的 MDX
扩展会按 JSX 规则解析，于是把 `<https://…>` 这类合法 autolink 误报成
`Unexpected character /`。本扩展把 `.mdx` 当作独立语言 `meowmdx`，据此：

- **语法高亮**：frontmatter、标题、加粗/斜体/删除线/行内代码、链接与 `<autolink>`、
  图片、嵌套列表与任务清单、对齐表格、嵌套引用、脚注、`---` 分隔线；代码块按渲染器
  的真实行为区分——`term/console/shell/sh/bash/裸fence` 走**终端外观**（高亮 `❯`、
  暗化 `#` 注释行），其余语言（json/js/python/rust/yaml/diff/ini…）内嵌对应语言高亮；
  `:::` 指令与 `=== 面板` 标记。
- **不跑 JSX 校验**：那些假红波浪消失。
- **代码片段**：`fm`/`fmmin`（frontmatter 模板）、`tip`/`note`/`warning`/`danger`/
  `info`、`tabs`、`details`、`card`、`cards`/`steps`（卡片网格 / 步骤卡）、`api-latest`
  （内联实时构建面板）、`term`、`code`、`table`、`fn`。
- **契合项目 schema 的诊断**（可在设置里关）：必填字段缺失、未知 `section`/`icon`、
  `order` 非整数、布尔字段非 true/false、未知 `:::` 指令、未知 frontmatter 字段——
  全部对照 `gen-docs.mjs` 的 SECTIONS/ICONS 与 `mdx.js` 的指令表。

## 安装

### 方式一：开发宿主（最快，试用）

1. 用 VS Code 打开 `tools/meowmdx-vscode` 目录。
2. 按 `F5` → 弹出「扩展开发宿主」窗口，在其中打开本仓库，`.mdx` 即生效。

### 方式二：打包成 .vsix 长期安装

```bash
cd tools/meowmdx-vscode
npx --yes @vscode/vsce package            # 生成 meowmdx-0.1.0.vsix
code --install-extension meowmdx-0.1.0.vsix
```

（无第三方运行时依赖，只用 VS Code 内置 API，打包前无需 npm install。）

## 让 .mdx 用上本扩展

仓库根的 `.vscode/settings.json` 已把关联固定好：

```json
{ "files.associations": { "*.mdx": "meowmdx" } }
```

这样即便同时装了官方 MDX 扩展，本仓库的 `.mdx` 也一律用 `meowmdx` 语言、不再跑 JSX
校验。`.vscode/extensions.json` 还把官方 `unifiedjs.vscode-mdx` 列入
`unwantedRecommendations`，VS Code 会建议在本工作区停用它。想临时切别的语言：命令
面板运行 `Change Language Mode` 即可。

## 与渲染器保持同步

诊断规则是照着源码手写的常量（见 `extension.js` 顶部）。若改了 `gen-docs.mjs` 的
`SECTIONS`/`ICONS` 或 `mdx.js` 的指令/终端语言表，记得同步：

- `SECTIONS` → `extension.js` 的 `SECTIONS`
- `ICONS` → `extension.js` 的 `ICONS`
- `CALLOUTS` + `COMPONENTS` → `extension.js` 的 `DIRECTIVES`
- `TERMINAL_LANGS` → 语法文件 `fence_terminal_named` 的语言列表

## 文件

| 文件 | 作用 |
|---|---|
| `package.json` | 扩展清单：语言/语法/片段/配置注册 |
| `language-configuration.json` | 括号、自动闭合、回车续列表 |
| `syntaxes/meowmdx.tmLanguage.json` | TextMate 语法（高亮） |
| `snippets/meowmdx.code-snippets` | 代码片段 |
| `extension.js` | schema 诊断（frontmatter + 指令） |

## 关掉诊断

设置 `meowmdx.validate.enable` = `false`。

