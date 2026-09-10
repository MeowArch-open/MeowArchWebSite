#!/usr/bin/env bash
# ============================================================
# MeowArch 全站发布脚本
#   主站 + /docs/ 外壳 + /docs-content/ VitePress 文档应用
#   产出 deploy/ 目录，上传任意静态托管即可同源上线
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY="$ROOT/deploy"
DOCS_DIST="$ROOT/docs-site/docs/.vitepress/dist"

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
mkdir -p "$DEPLOY/docs" "$DEPLOY/docs-content"

# 主站静态文件
for f in index.html download.html devices.html admin.html \
         docs-frame.js admin.js devices.js i18n.js script.js styles.css \
         api-config.js LICENSE; do
  [ -f "$ROOT/$f" ] && cp "$ROOT/$f" "$DEPLOY/"
done
cp -r "$ROOT/assets" "$DEPLOY/assets"

# 原始 VitePress 应用位于独立路径，避免 /docs/ 外壳递归嵌入自身。
cp -r "$DOCS_DIST/." "$DEPLOY/docs-content/"

# /docs/ 及每个静态 .html 深链接都发布同一个主站外壳。
cp "$ROOT/docs.html" "$DEPLOY/docs/index.html"
while IFS= read -r -d '' page; do
  relative="${page#"$DOCS_DIST/"}"
  [ "$relative" = "index.html" ] && continue
  destination="$DEPLOY/docs/$relative"
  mkdir -p "$(dirname "$destination")"
  cp "$ROOT/docs.html" "$destination"
done < <(find "$DOCS_DIST" -type f -name '*.html' -print0)

echo "[4/4] 完成 ✅ 发布目录就绪：$DEPLOY"
echo "      文档外壳：/docs/；VitePress 应用：/docs-content/"
echo "      本地预览: cd $DEPLOY && python3 -m http.server 8080"
