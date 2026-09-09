#!/usr/bin/env bash
# ============================================================
# MeowArch 全站发布脚本
#   主站静态文件 + 文档站（git submodule → VitePress 构建 → /docs/）
#   产出 deploy/ 目录，上传任意静态托管即可「同源无缝」上线
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY="$ROOT/deploy"

echo "[1/4] 同步 docs-site submodule ..."
git submodule update --init --recursive

echo "[2/4] 构建文档站 ..."
NPM_ARGS="--include=dev"
[ -n "${NPM_CACHE:-}" ] && NPM_ARGS="$NPM_ARGS --cache $NPM_CACHE"
(
  cd "$ROOT/docs-site"
  npm ci $NPM_ARGS
  npm run build
)

echo "[3/4] 组装发布目录 $DEPLOY ..."
rm -rf "$DEPLOY"
mkdir -p "$DEPLOY/docs"

# 主站静态文件
for f in index.html download.html devices.html admin.html \
         admin.js devices.js i18n.js script.js styles.css api-config.js LICENSE; do
  [ -f "$ROOT/$f" ] && cp "$ROOT/$f" "$DEPLOY/"
done
cp -r "$ROOT/assets" "$DEPLOY/assets"

# 文档站产物 → /docs/
cp -r "$ROOT/docs-site/docs/.vitepress/dist/." "$DEPLOY/docs/"

echo "[4/4] 完成 ✅ 发布目录就绪：$DEPLOY"
echo "      本地预览: cd $DEPLOY && python3 -m http.server 8080"