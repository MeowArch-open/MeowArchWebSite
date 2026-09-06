# MeowArch WebSite

MeowArch 是一个轻量、清爽的 Arch Linux 主题宣传首页。项目使用原生 HTML、CSS 和 JavaScript，不需要构建工具或前端框架。

- 在线站点：<https://xingguangcuican6666.github.io/MeowArchWebSite/>
- GitHub 仓库：<https://github.com/xingguangcuican6666/MeowArchWebSite>

## 功能

- 响应式桌面端与移动端布局
- 页面顶部流式导航，向下滚动后自动缩小并悬浮
- 移动端汉堡菜单与锚点导航，桌面端主题切换
- 使用同一份简化图标派生的浏览器图标、Apple Touch Icon 和品牌图标
- GitHub Pages 自动部署 workflow

## 目录

```text
.
├── index.html
├── styles.css
├── script.js
├── assets/
├── docs/DEPLOYMENT.md
├── .github/workflows/deploy-pages.yml
├── .gitignore
└── README.md
```

## 环境要求

本地预览只需要以下任一环境：

- Python 3.8+
- Node.js 18+（可选）

发布到 GitHub 需要：

- Git
- GitHub CLI `gh`
- 已登录并拥有创建仓库、写入 workflow 的权限

## 本地运行

进入项目目录后启动一个静态文件服务器：

```bash
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173/>。

也可以使用 Node.js：

```bash
npx serve .
```

不要直接双击 `index.html` 作为长期预览方式。静态服务器能正确处理相对资源路径、锚点和浏览器缓存行为。

## 修改内容

- 页面结构和文案：`index.html`
- 布局、颜色和响应式规则：`styles.css`
- 菜单、主题和滚动导航行为：`script.js`
- 插画、特性图标和 favicon：`assets/`

顶部网页图标文件为：

```text
assets/meowarch-header-icon.png
assets/favicon.ico
assets/favicon-32.png
assets/favicon-64.png
assets/apple-touch-icon.png
```

如果替换图标，建议同时更新 ICO、两个 PNG favicon 和 Apple Touch Icon，并在 `index.html` 中保持对应的 `sizes` 声明。

## 创建仓库并推送

如果还没有 GitHub 登录状态：

```bash
gh auth login
```

在项目根目录执行：

```bash
git init -b main
git add .
git commit -m "feat: create MeowArch landing page"
gh repo create MeowArchWebSite --public --source=. --remote=origin --push
```

上面的命令会创建公开仓库 `xingguangcuican6666/MeowArchWebSite`，并把当前 `main` 分支推送到 `origin`。

后续更新：

```bash
git add .
git commit -m "update: refresh landing page"
git push origin main
```

## 部署到 GitHub Pages

仓库中的 `.github/workflows/deploy-pages.yml` 会在每次推送到 `main` 后自动发布整个静态站点。

首次部署步骤：

1. 进入仓库的 **Settings → Pages → Build and deployment**，将 **Source** 设置为 **GitHub Actions**。如果已经通过 API 或仓库设置完成，这一步无需重复。
2. 推送代码后打开仓库的 **Actions** 页面，等待 `Deploy MeowArch to GitHub Pages` 完成。
3. 部署成功后，站点地址通常是：

   ```text
   https://xingguangcuican6666.github.io/MeowArchWebSite/
   ```

每次 `git push origin main` 都会触发新的部署。Actions 页面中的部署任务会显示实际的 `page_url`。

更完整的命令、发布检查和自定义域名步骤见 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)。

## 其他静态托管

这个项目没有构建步骤，因此也可以直接部署到 Cloudflare Pages、Netlify、Vercel 或任意静态文件服务器：

- 构建命令：留空
- 发布目录：项目根目录 `.`
- 输出目录：不需要

确保服务器保留 `assets/` 路径，否则页面中的插画和 favicon 会返回 404。

## 常见问题

### 页面图片显示不出来

确认是在项目根目录启动服务器，并检查浏览器开发者工具中的请求路径。所有资源引用都使用相对路径，例如 `assets/hero-catgirl.png`。

### GitHub Pages 页面是空白的

确认 workflow 已成功运行，并在 **Settings → Pages** 选择 **GitHub Actions**。如果仓库名或账号发生变化，README 中的示例地址也需要替换为实际地址。

### 这是不是 MeowArch 系统安装器？

不是。本仓库是 MeowArch 宣传首页，README 中的“安装”指网站本地运行和部署；Arch Linux 发行版本身的安装介质与安装流程需要单独维护。
