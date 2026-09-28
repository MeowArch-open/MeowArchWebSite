# MeowArch WebSite — “Neko Terminal” redesign

MeowArch 官网的完全重设计版：一个**暗色优先、终端风 × 猫猫**美学的 Arch Linux
发行版宣传站。原生 HTML / CSS / JavaScript，无构建工具、无框架、无运行时依赖。

- 设计基调：ink 深色界面 + 猫橘（amber）主色 + Arch 天蓝（sky）辅色
- 首页 hero 是一台会打字的终端，跑着 `fastfetch`（ASCII 猫猫 + 系统信息）
- 卡片悬停会长出猫耳，页面里散落着爪印与拱门元素
- **API 与原站保持一致且真实可用**：`https://api.meowarch.top/api/v1`

## 页面

| 页面 | 说明 |
| --- | --- |
| `index.html` | 首页：终端 hero、特性、**实时「最新构建」面板（Release API）**、动态、社区 |
| `download.html` | 下载页：分支选择（桌面版筹备中 / 移动版可用）、实时设备列表、最新构建直链、SHA256 校验、刷机检查清单 |
| `devices.html` | 设备选择页：拉取机型卡片，点击加载该机型 latest 版本（iso / ESP 镜像 / boot 镜像 + 校验值）；支持 `?codename=` 深链；API 离线时回退内置数据 |
| `admin.html` | 数据管理页：管理员令牌解锁（仅存 sessionStorage）、设备增删改、版本发布编辑器 |
| `docs/` | **文档站（全新设计）**：快速开始 / 安装 / FAQ / 下载，中英双语正文，侧边栏 + 本页目录，主题与语言和主站实时同步 |

## API

API 地址只在 [`api-config.js`](api-config.js) 一处配置（保持原值不变）：

```js
window.MEOWARCH_API_BASE = "https://api.meowarch.top/api/v1";
```

公共接口（站点使用，无需鉴权）：

- `GET /devices?flavor=meowarchmobile` — 机型列表
- `GET /releases/latest?flavor=meowarchmobile&codename=<代号>` — 最新版本与下载信息

管理接口（`admin.html` 使用，Bearer 鉴权）：

- `POST /admin/devices` · `DELETE /admin/devices?flavor=&codename=` — 设备管理
- `POST /admin/releases` — 发布版本（自动刷新 `isLatest`）

统一响应包装 `{ "code": 0, "message": "success", "data": … }`，前端在
[`js/api.js`](js/api.js) 中统一解包。API 后端本身独立部署（见原仓库
`MeowArch-open/MeowArchWebSite` 的 `api/` 目录），本仓库只包含前端站点。

## 结构

```text
.
├── index.html            # 首页
├── download.html         # 下载页
├── devices.html          # 设备选择页
├── admin.html            # 数据管理页（URL 直访）
├── styles.css            # 完整设计系统（明暗双主题、响应式、动效）
├── api-config.js         # API 地址（唯一配置点）
├── assets/               # 品牌 SVG / favicon（全部新生成）
├── docs/                 # 文档站（同设计语言重写，替代原 VitePress + iframe 外壳）
│   ├── index.html        # 文档首页（指南卡片）
│   ├── guide/            # 快速开始 / 安装 / FAQ
│   ├── download.html     # 下载文档（含实时最新构建面板）
│   ├── docs.css          # 文档布局：侧边栏、目录、正文排版、提示框
│   └── docs.js           # 侧边栏高亮、移动端折叠、目录生成、跨标签页主题/语言同步
└── js/
    ├── i18n.js           # en / zh-CN 词典、自动检测、切换器
    ├── api.js            # API 客户端（信封解包、超时、错误类型）
    ├── render.js         # 发布数据共享渲染器（构建卡、校验框等）
    ├── ui.js             # 主题、导航、移动菜单、滚动显现、打字机
    ├── home.js           # 首页：实时最新构建 + hero 药丸
    ├── download.js       # 下载页：设备列表 + 最新构建
    ├── devices.js        # 设备页：机型/版本拉取、离线回退、深链
    └── admin.js          # 管理页：令牌、设备 CRUD、发布编辑器
```

## 文档站

`docs/` 是与主站同一设计语言的纯静态文档（无构建工具，替代原仓库的
VitePress + iframe 外壳方案）：

- 正文**中英双语**（`data-i18n` 驱动 `html[lang]`，CSS 切换对应语言块），
  顶部语言切换器与主站共用同一份词典与 localStorage 键；
- 主题（`meowarch_theme`）与语言（`meowarch_lang`）与主站**实时同步**，
  跨标签页通过 `storage` 事件联动；
- 侧边栏当前页高亮，移动端折叠；宽屏右栏自动生成本页目录并带滚动高亮；
- 下载文档页内嵌**实时最新构建面板**（复用 `js/api.js` + `js/render.js`）；
- 部署时整个 `docs/` 目录随主站同源发布到 `/docs/` 路径即可，无需构建。

## 本地预览

```bash
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173/
```

## 特性

- 暗色 / 亮色双主题（默认暗色，跟随切换，持久化存储，尊重
  `prefers-reduced-motion`）
- 前端多语言（English / 简体中文）：按浏览器语言自动选择，顶栏一键切换，
  选择持久化，动态数据随语言切换即时重渲染
- 首页、下载页、设备页的数据全部来自真实 API；离线时优雅降级并提示
- 移动端汉堡菜单、滚动显现动画、终端打字机效果
- 管理页令牌仅存 sessionStorage，退出即清除

## 部署

- 文档站已包含在 `docs/` 目录内，随主站一起发布到 `/docs/` 路径，
  顶栏 Docs 链接开箱即用（原 VitePress 独立仓库方案不再需要）。
- 纯静态站点，可部署到 GitHub Pages、Cloudflare Pages、Netlify 或任意
  静态服务器：构建命令留空，发布目录为根目录 `.`。
- 注意保留 `assets/` 与 `docs/` 目录，否则图标、favicon 和文档站会 404。

## 许可

Apache-2.0（见 [LICENSE](LICENSE)）。MeowArch 是社区项目，与 Arch Linux
无隶属关系；MeowArchMobile 仅面向已解锁设备，刷机请自行备份并承担风险。
