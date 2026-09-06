# MeowArch 部署教程

本文给出从本地预览到 GitHub Pages 发布的完整流程。

- 仓库：<https://github.com/xingguangcuican6666/MeowArchWebSite>
- 在线站点：<https://xingguangcuican6666.github.io/MeowArchWebSite/>

## 1. 本地预览

```bash
cd /path/to/MeowArchWebSite
python3 -m http.server 4173
```

访问 <http://127.0.0.1:4173/>。停止服务时按 `Ctrl+C`。

## 2. 首次初始化 Git

```bash
git init -b main
git add .
git commit -m "feat: create MeowArch landing page"
```

检查提交内容：

```bash
git status
git log -1 --oneline
```

## 3. 用 gh 创建并推送公开仓库

确认 `gh` 已登录：

```bash
gh auth status
```

创建仓库并直接推送：

```bash
gh repo create MeowArchWebSite --public --source=. --remote=origin --push
```

验证远程地址：

```bash
git remote -v
gh repo view --web
```

## 4. 开启 GitHub Pages

仓库内已经包含 `.github/workflows/deploy-pages.yml`。它使用 GitHub 官方 Pages Actions：

1. `actions/checkout` 检出源码。
2. `actions/configure-pages` 配置 Pages 环境。
3. `actions/upload-pages-artifact` 上传项目根目录的静态文件。
4. `actions/deploy-pages` 发布站点。

第一次推送前，先进入仓库的 **Settings → Pages → Build and deployment**，将 **Source** 设置为 **GitHub Actions**。如果已经通过 API 设置了 `build_type=workflow`，可以直接等待 workflow 运行。

第一次推送后：

1. 打开仓库的 **Actions** 页面。
2. 等待 `Deploy MeowArch to GitHub Pages` 完成。
3. 从 workflow 的 `page_url` 输出或仓库 Pages 页面复制最终网址。

默认项目站点地址格式：

```text
https://<github-user>.github.io/<repository-name>/
```

## 5. 发布更新

```bash
git add .
git commit -m "update: change page content"
git push origin main
```

推送完成后，Actions 会自动重新发布。可以用以下命令查看最近运行：

```bash
gh run list --workflow deploy-pages.yml --limit 5
gh run watch
```

## 6. 自定义域名

在仓库 **Settings → Pages → Custom domain** 中填写域名，按 GitHub 提示添加 DNS 记录。自定义域名生效后，GitHub 会自动生成或更新 HTTPS 证书。

## 7. 发布前检查

```bash
npx --yes html-validate index.html
npx --yes prettier --check styles.css script.js README.md docs/DEPLOYMENT.md .github/workflows/deploy-pages.yml
```

如果没有安装 Node.js，只运行本地服务器也可以；上述检查命令只是可选的质量检查。
