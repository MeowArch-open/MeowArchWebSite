# MeowArch Release API 使用手册 (v1)

MeowArch / MeowArchMobile 的发布与下载后端 API：网站（download 页、devices 页）
用**公共接口**查询机型与最新版本；维护者/CI 用**带鉴权的管理接口**上传 ISO 并发布版本。

大文件上传采用「**获取 Azure SAS 预签名直传凭证 → 客户端直传 Azure Blob → 提交版本元数据入库**」
的云原生模式，大文件不经过后端服务器；另提供「后端流式直传」作为备选方案（方案 B）。

> 本文件是**操作手册**：先看「快速开始」3 步跑通，再按「环境变量指南」配置你的环境，
> 最后照「端到端演练」发布一个真实版本。

---

## 目录

1. [快速开始（本地零配置）](#1-快速开始本地零配置)
2. [环境变量配置指南](#2-环境变量配置指南)
3. [三种运行场景的配置模板](#3-三种运行场景的配置模板)
4. [鉴权与管理员令牌](#4-鉴权与管理员令牌)
5. [接口使用说明](#5-接口使用说明)
6. [端到端演练：发布一个新版本](#6-端到端演练发布一个新版本)
7. [与前端网站对接](#7-与前端网站对接)
8. [常见问题 FAQ](#8-常见问题-faq)
9. [测试 / 部署 / 目录结构](#9-测试--部署--目录结构)

---

## 1. 快速开始（本地零配置）

不需要任何云服务，内存数据库 + 本地磁盘 + 自动生成的管理员令牌，3 步跑通：

```bash
cd api
npm install        # 安装依赖（首次需要网络，装一次即可）
npm start          # 启动服务
```

看到如下输出即成功（端口默认 3000）：

```
MeowArch API listening on http://127.0.0.1:3000 (development)
DB: in-memory | Storage: local disk
Dev admin token (use as Bearer): 3f9c1a2b...   ← 记下这个令牌，管理接口要用
```

> 每次启动令牌都会变（开发模式自动生成）。想让令牌固定不变，见
> [第 3 节场景 A](#3-三种运行场景的配置模板) 的 `ADMIN_SECRET_KEY`。

**立刻验证服务是活的**（另开一个终端，进 `api` 目录）：

```bash
# 1) 支持的机型列表（公共接口，无需令牌）
curl http://127.0.0.1:3000/api/v1/devices
# 期望：{"code":0,"message":"success","data":[{"brand":"Xiaomi","model":"Redmi K80","codename":"munch",...}, ...]}

# 2) munch 机型的最新版本（公共接口）
curl "http://127.0.0.1:3000/api/v1/releases/latest?flavor=meowarchmobile&codename=munch"
# 期望：返回 v1.0.0 的 iso/torrent/bootImg 下载地址与 sha256

# 3) 不带令牌调用管理接口 → 401
curl -X POST http://127.0.0.1:3000/api/v1/admin/upload-ticket -H "Content-Type: application/json" -d '{}'
# 期望：{"code":401,"message":"missing or malformed Authorization header","data":null}
```

停止服务：在启动终端按 `Ctrl+C`。

常用 npm 命令：

| 命令 | 作用 |
| --- | --- |
| `npm start` | 启动服务（自动读取 `api/.env`，存在才读） |
| `npm run dev` | 开发模式：改代码自动重启 |
| `npm run seed -- --force` | 重置种子数据（2 台设备 + munch v1.0.0 示例版本） |
| `npm test` | 运行冒烟测试（15 项） |

---

## 2. 环境变量配置指南

### 2.1 配置文件怎么来的

服务通过 `npm start` 启动时会**自动读取 `api/.env` 文件**（有就加载，没有就不加载）。
所以配置方式只有两步：

```bash
cd api
cp .env.example .env     # Windows 用：copy .env.example .env
```

然后编辑 `api/.env`。`.env` 已被 git 忽略，不会误提交到仓库。

> 不想用文件也可以临时用环境变量：`PORT=8080 npm start`（命令行优先级最高）。

### 2.2 全部变量说明

| 变量 | 默认值 | 干什么的 | 什么时候必须填 |
| --- | --- | --- | --- |
| `PORT` | `3000` | 服务监听端口 | 端口被占用时改 |
| `NODE_ENV` | `development` | 运行环境；`production` 时**必须**配鉴权，否则拒绝启动 | 部署到生产时填 `production` |
| `ADMIN_SECRET_KEY` | 空 | 固定管理员令牌（推荐，最简单） | 生产必填；本地想固定令牌也填 |
| `JWT_SECRET` | 空 | 可选：改用 JWT 验签（令牌有时效） | 二选一：与 `ADMIN_SECRET_KEY` 只填一个 |
| `MONGODB_URI` | 空 | MongoDB 连接串；**留空 = 内存存储（重启数据清空）** | 想持久化版本数据时填 |
| `AZURE_STORAGE_CONNECTION_STRING` | 空 | Azure 存储连接串；**留空 = 本地磁盘存储** | 生产走 SAS 直传时填 |
| `AZURE_CONTAINER_NAME` | `release` | Azure 里存放 ISO 的容器名 | 用 Azure 时按需改 |
| `AZURE_PUBLIC_BASE_URL` | 账户默认域名 | 覆盖公开下载地址的域名前缀 | 自定义域名/CDN 时填 |
| `PUBLIC_BASE_URL` | `http://127.0.0.1:PORT` | 本地模式下 publicUrl/uploadUrl 的前缀 | 本地模式且改了端口时同步改 |
| `UPLOAD_TICKET_TTL_SECONDS` | `3600` | 上传凭证有效期（秒） | 上传大文件超时时调大 |

### 2.3 这些值从哪里来

- **`ADMIN_SECRET_KEY`**：自己生成一串随机值，例如：

  ```bash
  openssl rand -hex 32        # 输出如 9f3a... 抄进 .env 即可
  ```

- **`MONGODB_URI`**：在 MongoDB Atlas（或自建 Mongo）建好库后，复制连接串，形如：

  ```
  mongodb+srv://用户名:密码@集群地址/meowarch?retryWrites=true&w=majority
  ```

- **`AZURE_STORAGE_CONNECTION_STRING`**：Azure 门户 → 你的存储账户 → **访问密钥 (Access keys)** → 复制「连接字符串」，形如：

  ```
  DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx...;EndpointSuffix=core.windows.net
  ```

  容器 `release` 无需手动创建，服务启动时会自动建（公共读权限）。

---

## 3. 三种运行场景的配置模板

### 场景 A：纯本地（零配置，体验全流程）

不创建 `.env` 也行；创建的话保持默认即可：

```dotenv
PORT=3000
NODE_ENV=development
ADMIN_SECRET_KEY=my-local-fixed-token          # 可选：让令牌固定不变
# MONGODB_URI、AZURE_* 全部留空 = 内存库 + 本地磁盘
```

### 场景 B：本地 + MongoDB（数据持久化，不上 Azure）

```dotenv
PORT=3000
NODE_ENV=development
ADMIN_SECRET_KEY=my-local-fixed-token
MONGODB_URI=mongodb+srv://用户名:密码@集群地址/meowarch?retryWrites=true&w=majority
# AZURE_STORAGE_CONNECTION_STRING 留空 = 文件仍存本地磁盘，下载走 PUBLIC_BASE_URL
PUBLIC_BASE_URL=http://127.0.0.1:3000
```

### 场景 C：生产（MongoDB + Azure Blob + 固定令牌，推荐）

```dotenv
PORT=3000
NODE_ENV=production
ADMIN_SECRET_KEY=9f3a...（openssl rand -hex 32 生成）
MONGODB_URI=mongodb+srv://.../meowarch?retryWrites=true&w=majority
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
AZURE_CONTAINER_NAME=release
PUBLIC_BASE_URL=https://你的域名.com
```

> 生产环境务必走 HTTPS（反向代理/平台层配置），并且 `NODE_ENV=production` 且配了鉴权，
> 否则服务会拒绝启动（这是故意的安全保护）。

---

## 4. 鉴权与管理员令牌

所有 `/api/v1/admin/*` 接口必须在请求头带令牌：

```
Authorization: Bearer <令牌>
```

三种令牌来源（按优先级）：

| 方式 | 怎么配 | 怎么拿令牌 |
| --- | --- | --- |
| **静态令牌（推荐）** | `.env` 设 `ADMIN_SECRET_KEY` | 令牌就是 `ADMIN_SECRET_KEY` 的值，自己保管 |
| **JWT（有时效）** | `.env` 设 `JWT_SECRET` | 自己签发：`node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({role:'admin'}, process.env.JWT_SECRET, {expiresIn:'24h'}))"`（在 `api/` 目录运行；payload 必须含 `role:'admin'`） |
| **开发自动令牌** | 什么都不配（且非 production） | 每次启动打印在控制台，`Dev admin token (use as Bearer): ...` |

一个请求示例：

```bash
curl -X POST http://127.0.0.1:3000/api/v1/admin/upload-ticket \
  -H "Authorization: Bearer 你的令牌" \
  -H "Content-Type: application/json" \
  -d '{"flavor":"meowarchmobile","codename":"munch","fileName":"x.iso","fileType":"iso"}'
```

---

## 5. 接口使用说明

统一规则：基础路径 `/api/v1`；返回包装 `{ "code": 0, "message": "success", "data": ... }`；
`code=0` 成功，失败时 `code` = HTTP 状态码、`data` = `null`。

| 状态码 | 含义 |
| --- | --- |
| 200 | 请求成功 |
| 400 | 参数缺失或格式错误 |
| 401 | 未提供凭证或凭证已失效 |
| 403 | 权限不足（如 JWT 里没有 admin 角色） |
| 404 | 资源或机型不存在 |
| 500 | 服务端或数据库异常 |

### 5.1 公共接口（网站用，无需令牌）

**① 机型列表** —— 设备选择页用

```
GET /api/v1/devices?flavor=meowarchmobile
```

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| flavor | 否 | `meowarch` / `meowarchmobile`，默认 `meowarchmobile` |

```bash
curl "http://127.0.0.1:3000/api/v1/devices"
```

**② 最新版本及下载信息** —— 下载页用

```
GET /api/v1/releases/latest?flavor=meowarchmobile&codename=munch
```

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| flavor | 是 | `meowarch` 或 `meowarchmobile` |
| codename | 条件必填 | `flavor=meowarchmobile` 时必须传 |

```bash
curl "http://127.0.0.1:3000/api/v1/releases/latest?flavor=meowarchmobile&codename=munch"
```

返回的 `data` 形如：

```json
{
  "flavor": "meowarchmobile",
  "version": "v1.0.0",
  "releaseDate": "August 2026",
  "device": { "brand": "Xiaomi", "model": "Redmi K80", "codename": "munch", "arch": "aarch64" },
  "artifacts": {
    "iso":     { "fileName": "meowarch-mobile-1.0.0-munch.iso", "url": "https://...", "fileSize": "~850 MB", "sha256": "e3b0c442..." },
    "torrent": { "fileName": "...", "url": "..." },
    "bootImg": { "fileName": "boot-munch.img", "url": "...", "sha256": "..." }
  },
  "notes": { "androidBase": "HyperOS 2", "kernelVersion": "Linux 6.6.x" }
}
```

没有该机型的最新版会返回 **404**（前端会显示「暂无版本」）。

### 5.2 管理接口（需令牌）

**① 获取上传凭证（方案 A 第一步）**

```
POST /api/v1/admin/upload-ticket
```

请求体：

```json
{
  "flavor": "meowarchmobile",
  "codename": "munch",
  "fileName": "meowarch-mobile-1.0.0-munch.iso",
  "fileType": "iso"
}
```

`fileType` 与文件名后缀必须匹配：`iso`→`.iso`、`torrent`→`.torrent`、`bootImg`→`.img`。

响应里的三个字段：

- `blobPath`：文件在存储中的路径（`mobile/munch/xxx.iso`）
- `publicUrl`：发布后公开下载的地址
- `uploadUrl`：**直传地址** ——
  - 配了 Azure：Azure SAS 直传 URL（带 `?sp=cw&sig=...`），客户端直接 PUT 大文件；
  - 没配 Azure（本地模式）：指向本服务的流式上传端点（见 ②），PUT 时需带同一 Bearer 令牌。

**② 上传文件（两种模式）**

Azure 模式（大文件直传 Blob，不经过本服务）：

```bash
curl -X PUT -T ./meowarch-mobile-1.0.0-munch.iso \
  -H "x-ms-blob-type: BlockBlob" \
  "<uploadUrl>"          # 上一步返回的 SAS 地址
```

本地模式（走方案 B 流式端点，`uploadUrl` 已带好查询参数，只需带令牌）：

```bash
curl -X PUT -T ./meowarch-mobile-1.0.0-munch.iso \
  -H "Authorization: Bearer 你的令牌" \
  -H "Content-Type: application/octet-stream" \
  "<uploadUrl>"          # 上一步返回的 http://127.0.0.1:3000/api/v1/admin/uploads?...
```

> 方案 B 也可单独直接调用：`PUT /api/v1/admin/uploads?flavor=&codename=&fileType=&fileName=`，请求体为文件字节流。

**③ 提交版本元数据（发布）**

文件上传成功后，把版本信息写入数据库（自动刷新 `isLatest`）：

```
POST /api/v1/admin/releases
```

```bash
curl -X POST http://127.0.0.1:3000/api/v1/admin/releases \
  -H "Authorization: Bearer 你的令牌" \
  -H "Content-Type: application/json" \
  -d '{
    "flavor": "meowarchmobile",
    "version": "v1.0.0",
    "channel": "stable",
    "releaseDate": "August 2026",
    "isLatest": true,
    "device": {
      "brand": "Xiaomi",
      "model": "Redmi K80",
      "codename": "munch",
      "soc": "Snapdragon 8 Gen 3",
      "arch": "aarch64",
      "status": "official"
    },
    "artifacts": {
      "iso": {
        "fileName": "meowarch-mobile-1.0.0-munch.iso",
        "url": "https://你的存储/release/mobile/munch/meowarch-mobile-1.0.0-munch.iso",
        "fileSize": "854 MB",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "torrent": { "fileName": "...", "url": "..." }
    },
    "notes": { "androidBase": "HyperOS 2", "kernelVersion": "Linux 6.6.x" }
  }'
```

规则：

- `sha256` 若提供必须是 64 位十六进制；
- `isLatest: true` 时，后端会先把同一 `flavor`（+`codename`）下其他版本的 `isLatest` 置为 `false`，再写入当前版本；
- 同一 `flavor + codename + version` 重复提交 = 更新（upsert）。

**④ 设备条目管理（新增/编辑/删除）**

```
POST   /api/v1/admin/devices                      # 新增或编辑设备（按 flavor+codename upsert）
DELETE /api/v1/admin/devices?flavor=&codename=    # 删除设备
```

新增/编辑（省略的字段用默认值：`flavor`→`meowarchmobile`、`status`→`community`、`soc`→空）：

```bash
curl -X POST http://127.0.0.1:3000/api/v1/admin/devices \
  -H "Authorization: Bearer 你的令牌" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Xiaomi",
    "model": "Redmi K80",
    "codename": "munch",
    "soc": "Snapdragon 8 Gen 3",
    "status": "official"
  }'
```

删除：

```bash
curl -X DELETE "http://127.0.0.1:3000/api/v1/admin/devices?flavor=meowarchmobile&codename=munch" \
  -H "Authorization: Bearer 你的令牌"
```

规则：

- `codename` 只允许字母/数字/`_`/`-`；改 `codename` 等于**新建**一条设备（upsert 键是 flavor+codename）；
- **删除只删设备条目，不级联删版本记录**（该机型的版本仍可被 `/releases/latest` 直接查询，只是不再出现在设备列表）；
- 设备不存在时删除返回 404。

---

## 6. 端到端演练：发布一个新版本

本地模式（无需任何云）完整走一遍「上传 → 发布 → 网站可查」。假设服务已启动。

```bash
# 0) 定义令牌变量（启动日志里抄的，或你自己的 ADMIN_SECRET_KEY）
TOKEN=你的令牌

# 1) 拿上传凭证
curl -X POST http://127.0.0.1:3000/api/v1/admin/upload-ticket \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"flavor":"meowarchmobile","codename":"munch","fileName":"meowarch-mobile-2.0.0-munch.iso","fileType":"iso"}'
# → 记下 uploadUrl

# 2) 上传文件（本地模式，带令牌 PUT）
curl -X PUT -T ./meowarch-mobile-2.0.0-munch.iso \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/octet-stream" \
  "<上一步的uploadUrl>"
# → {"code":0,...,"data":{"blobPath":"mobile/munch/meowarch-mobile-2.0.0-munch.iso","publicUrl":"..."}}

# 3) 提交版本元数据（isLatest: true）
curl -X POST http://127.0.0.1:3000/api/v1/admin/releases \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"flavor":"meowarchmobile","version":"v2.0.0","releaseDate":"September 2026","isLatest":true,
       "device":{"brand":"Xiaomi","model":"Redmi K80","codename":"munch","arch":"aarch64","status":"official"},
       "artifacts":{"iso":{"fileName":"meowarch-mobile-2.0.0-munch.iso",
                           "url":"http://127.0.0.1:3000/api/v1/files/mobile/munch/meowarch-mobile-2.0.0-munch.iso",
                           "fileSize":"860 MB","sha256":"<64位hex>"}}}'

# 4) 验证：最新版已变成 v2.0.0（v1.0.0 的 isLatest 被自动清掉）
curl "http://127.0.0.1:3000/api/v1/releases/latest?flavor=meowarchmobile&codename=munch"
# → version: "v2.0.0"
```

> 注意第 3 步 `url` 要填文件**实际存放的公开地址**：本地模式即第 2 步返回的 `publicUrl`；
> Azure 模式即 Blob 公开 URL。

### 6.1 方案 A（Azure 直传）端到端全流程

配好 `AZURE_STORAGE_CONNECTION_STRING` 后（见[场景 C](#3-三种运行场景的配置模板)），
大文件不再经过本服务，直接 PUT 到 Azure Blob：

```bash
TOKEN=你的令牌

# 1) 拿 SAS 直传凭证（需要 Bearer 令牌）
curl -X POST http://127.0.0.1:3000/api/v1/admin/upload-ticket \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"flavor":"meowarchmobile","codename":"munch","fileName":"meowarch-mobile-2.0.0-munch.iso","fileType":"iso"}'
# → data.uploadUrl 形如：https://<账户>.blob.core.windows.net/release/mobile/munch/xxx.iso?sv=...&sp=cw&sig=...

# 2) 直传文件到 Azure（不经过后端；SAS 已在 URL 里，无需任何请求头鉴权）
curl -X PUT -T ./meowarch-mobile-2.0.0-munch.iso \
  -H "x-ms-blob-type: BlockBlob" \
  "<第1步的uploadUrl>"
# → 成功无响应体，HTTP 201

# 3) 提交版本元数据（url 填 Blob 公开地址，即 uploadUrl 去掉 ?sv=... 部分）
curl -X POST http://127.0.0.1:3000/api/v1/admin/releases \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"flavor":"meowarchmobile","version":"v2.0.0","releaseDate":"September 2026","isLatest":true,
       "device":{"brand":"Xiaomi","model":"Redmi K80","codename":"munch","arch":"aarch64","status":"official"},
       "artifacts":{"iso":{"fileName":"meowarch-mobile-2.0.0-munch.iso",
                           "url":"https://<账户>.blob.core.windows.net/release/mobile/munch/meowarch-mobile-2.0.0-munch.iso",
                           "fileSize":"860 MB","sha256":"<64位hex>"}}}'

# 4) 验证
curl "http://127.0.0.1:3000/api/v1/releases/latest?flavor=meowarchmobile&codename=munch"
# → version: "v2.0.0"，iso.url 指向 Blob
```

要点：

- SAS 凭证默认 **1 小时**有效（`UPLOAD_TICKET_TTL_SECONDS`），超时重跑第 1 步；
- SAS 权限仅 `cw`（该 blob 的创建/覆写），且 URL 里已含签名——所以第 2 步**不需要再带任何请求头**；
- `blobPath` 规则：`mobile/{codename}/{文件名}`（meowarchmobile）、`desktop/{文件名}`（meowarch）；
- 文件直传成功后元数据入库仍需 Bearer 令牌，泄漏 SAS 不能发布版本。

---

## 7. 与前端网站对接

1. 前端通过 `api-config.js` 里的 `window.MEOWARCH_API_BASE` 找 API（默认 `http://127.0.0.1:3000/api/v1`）。
2. 本地联调：先 `cd api && npm start`，再在项目根目录 `python3 -m http.server 4173`，打开
   `http://127.0.0.1:4173/download.html`。
3. 下载页选「MeowArchMobile」→ 跳 `devices.html`，会请求 `GET /devices` 拉机型；点机型 → 请求
   `GET /releases/latest?flavor=meowarchmobile&codename=xxx` 显示下载信息。
4. 部署到线上后，把 `api-config.js` 的地址改成你部署的 API 地址即可（跨域已放开）。

---

## 8. 常见问题 FAQ

**Q1：启动报 `Startup aborted: No auth configured...`**
原因：`NODE_ENV=production` 且没配 `ADMIN_SECRET_KEY` / `JWT_SECRET`（安全保护）。
解决：`.env` 里把 `NODE_ENV` 改回 `development`，或配置任一鉴权密钥。
（注意：有些云平台/CI 会预设 `NODE_ENV=production`，本地跑要显式覆盖。）

**Q2：调用管理接口返回 401**
令牌缺失/错误。开发模式每次启动令牌都不同，请复制最新启动日志里的 token，或用
`ADMIN_SECRET_KEY` 固定令牌。检查请求头格式：`Authorization: Bearer <token>`（注意 Bearer 后有一个空格）。

**Q3：upload-ticket 返回 400，说 fileName 必须 .iso/.torrent/.img**
`fileType` 和文件名后缀不匹配。iso→`.iso`、torrent→`.torrent`、bootImg→`.img`。

**Q4：`/releases/latest` 返回 404**
该 flavor（+codename）还没有 `isLatest: true` 的版本。先用 `POST /admin/releases` 发布一个。

**Q5：`EADDRINUSE` 端口被占用**
改 `.env` 里的 `PORT`（比如 8080），并把 `PUBLIC_BASE_URL` 同步改成新端口。

**Q6：本地模式上传后，重启服务文件/数据没了？**
内存数据库 + 本地磁盘都在 `api/.data/`（git 已忽略）。**内存库重启即清空**（版本元数据丢失）；
本地磁盘文件还在。要持久化请配置 `MONGODB_URI`。

**Q7：SAS 直传报签名过期**
`uploadUrl` 默认 1 小时有效。超时重新调用 `POST /admin/upload-ticket` 拿新的；大文件可调大
`UPLOAD_TICKET_TTL_SECONDS`。

**Q8：前端页面拿不到数据**
浏览器开发者工具 → Network 看请求是否发出、状态码：404 是 API 地址不对/路径错；500 看服务端日志；
CORS 报错确认 API 已启动且是较新版本（公共接口已放开 `Access-Control-Allow-Origin: *`）。

**Q9：Windows 下 `cp` 命令不存在**
用 `copy .env.example .env`。

**Q10：想清空数据重新播种**
`npm run seed -- --force`（会先清空 devices/releases 再写入示例数据）。

**Q11：可以用 Azure Cosmos DB for MongoDB 当数据库吗？**
可以（vCore 集群完全兼容）。在门户拿连接串后，注意两点：
- **密码里的特殊字符必须百分号转义**：`@` → `%40`（不转义驱动会解析错密码，报鉴权失败）。
  例：密码 `Liu@070504.` 应写成 `Liu%40070504.`；
- 建议在连接串里加 `/库名` 指定数据库（如 `/meowarch`），否则数据会落进默认 `test` 库。
  `npm run seed -- --force` 可一键把示例设备/版本写进库。

**Q12：连不上 MongoDB/Cosmos？**
依次排查：① 密码转义是否正确（`@`→`%40`，见 Q11）；② Cosmos 门户 → 网络设置里是否允许
公网访问、本机 IP 是否在白名单；③ 连接超时可在连接串加 `serverSelectionTimeoutMS=10000`；
④ 服务启动即失败（fail-fast）时，错误信息会直接打印在启动日志里，照着报错改。

---

## 9. 测试 / 部署 / 目录结构

### 测试

```bash
npm test
# node:test 冒烟测试：信封格式 / 公共接口 / 鉴权 401 / 上传闭环 / isLatest 刷新，共 15 项
```

### 部署建议

GitHub Pages 只能托管静态文件，**API 需要单独部署**到能跑 Node 20+ 的地方：

- Azure App Service / Azure Container Apps（与 Blob、Mongo 同生态，直传链路最短）；
- 任意 Node 主机 / PaaS / 容器平台。

生产 checklist：

- [ ] `NODE_ENV=production`
- [ ] `ADMIN_SECRET_KEY`（或 `JWT_SECRET`）已配置
- [ ] `MONGODB_URI` 已配置
- [ ] `AZURE_STORAGE_CONNECTION_STRING` 已配置（走 SAS 直传）
- [ ] HTTPS 已启用
- [ ] `PUBLIC_BASE_URL` 指向实际域名

### 目录结构

```text
api/
├── package.json          # npm 脚本：start / dev / seed / test
├── .env.example          # 环境变量样例（复制为 .env 使用）
├── server.js             # 启动入口
├── src/
│   ├── app.js            # Express 装配（路由/中间件/错误处理）
│   ├── config.js         # 环境变量解析
│   ├── envelope.js       # 统一响应包装 {code, message, data}
│   ├── auth.js           # Bearer 鉴权（静态令牌 / JWT / 开发令牌）
│   ├── validation.js     # 参数校验、文件名清洗
│   ├── storage.js        # Azure Blob SAS / 流式上传 / 本地磁盘
│   ├── db.js             # MongoDB / 内存数据层 + isLatest 刷新
│   ├── seed.js           # 种子数据
│   └── routes/
│       ├── public.js     # GET /devices、GET /releases/latest
│       └── admin.js      # POST /upload-ticket、PUT /uploads、POST /releases
└── test/api.test.js
```
