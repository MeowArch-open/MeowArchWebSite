/* MeowArch i18n — en / zh-CN dictionaries, DOM bindings, language switcher.
   Loaded before all page scripts. Bindings:
   data-i18n (textContent) · data-i18n-html (innerHTML) · data-i18n-aria
   (aria-label) · data-i18n-placeholder · data-i18n-alt · data-i18n-title
   (document.title) · data-i18n-meta (meta description). Missing keys fall
   back to English, then to whatever markup already contains. */
window.MEOWARCH_I18N = (() => {
  "use strict";

  const STORAGE_KEY = "meowarch_lang";
  const CHANGE_EVENT = "meowarch:langchange";

  const en = {
    /* titles + meta */
    "title.home": "MeowArch — a purrfectly minimal Arch experience",
    "title.download": "Download · MeowArch",
    "title.devices": "Choose your device · MeowArch",
    "title.admin": "Data management · MeowArch",
    "desc.home": "MeowArch is a lightweight, rolling, cat-approved Arch Linux experience for desktops and phones.",
    "desc.download": "Grab the latest MeowArch build, verify it, and boot into something cozy.",
    "desc.devices": "Pick your MeowArchMobile device and download the matching build.",
    "desc.admin": "MeowArch release data management — devices and builds.",

    /* shared chrome */
    "aria.skip": "Skip to content",
    "aria.brand": "MeowArch home",
    "aria.nav": "Primary navigation",
    "aria.theme": "Toggle light / dark theme",
    "aria.menu": "Open navigation menu",
    "aria.github": "MeowArch on GitHub",
    "aria.lang": "Language",
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.latest": "Latest",
    "nav.news": "News",
    "nav.download": "Download",
    "nav.docs": "Docs",
    "nav.community": "Community",
    "brand.tagline": "purrfectly minimal arch",
    "cta.download": "Download",
    "footer.tagline": "Built with Arch, care, and a quiet purr.",
    "footer.docs": "Documentation",
    "footer.github": "GitHub",
    "footer.admin": "Admin",
    "footer.back_top": "Back to top ↑",
    "footer.disclaimer": "MeowArch is a community project and is not affiliated with Arch Linux. MeowArchMobile is intended for unlocked devices only — flash at your own risk.",
    "status.official": "Official",
    "status.community": "Community",

    /* home hero */
    "home.eyebrow": "nya~ an Arch-based Linux distribution",
    "home.lede": "A lightweight, rolling Arch Linux experience with a soft paw on the keyboard — for your desktop, and for the phone in your pocket.",
    "home.cta_docs": "Read the docs",
    "pill.latest": "Latest build",
    "pill.loading": "checking the API…",
    "pill.offline": "see the download page",

    /* terminal + stats */
    "stats.1v": "< 10s",
    "stats.1k": "cold boot",
    "stats.2v": "2 GB",
    "stats.2k": "minimum RAM",
    "stats.3v": "pacman",
    "stats.3k": "native packaging",
    "stats.4v": "100%",
    "stats.4k": "cute, guaranteed",

    /* features */
    "feat.kicker": "why meowarch",
    "feat.title": "Small. Fast. Fluffy.",
    "feat.sub": "Everything you expect from Arch, minus the parts that scratch.",
    "feat1.title": "Cat-powered",
    "feat1.desc": "Infused with the spirit of cats and cute girls. Motivation included at no extra cost.",
    "feat2.title": "Lightweight",
    "feat2.desc": "Minimal by default, heavy on performance. No bloatware hiding in the shadows.",
    "feat3.title": "Customizable",
    "feat3.desc": "Tame it your way — from the kernel to the cursor, everything is yours to shape.",
    "feat4.title": "Reliable",
    "feat4.desc": "Built on Arch Linux, tested by the community, worshipped by house cats.",

    /* latest build */
    "latest.kicker": "straight from the API",
    "latest.title": "Latest build",
    "latest.sub": "Live release data served by the MeowArch Release API.",
    "latest.loading": "Fetching the freshest build from the API…",
    "latest.offline": "The API is napping right now — showing cached info. Try again later.",
    "latest.retry": "Retry",
    "latest.all_devices": "Browse all devices →",
    "release.flavor": "Flavor",
    "release.channel": "Channel",
    "release.codename": "Codename",
    "release.arch": "Arch",
    "release.soc": "SoC",
    "release.base": "Android base",
    "release.kernel": "Kernel",
    "art.iso.name": "Root filesystem",
    "art.torrent.name": "ESP image",
    "art.boot.name": "Boot image",
    "art.checksum": "SHA256 checksum",

    /* news */
    "news.kicker": "fresh from the cat tree",
    "news.title": "News",
    "news1.title": "MeowArchMobile v26.09 is out",
    "news1.sum": "Rebased on HyperOS 3 with kernel 7.0.12 — smoother, cooler, fluffier.",
    "news2.title": "Device support grows",
    "news2.sum": "More devices are getting official builds. Watch the devices page.",
    "news3.title": "Docs overhaul shipped",
    "news3.sum": "Installation guides rewritten with fewer scratches and more screenshots.",

    /* community */
    "comm.kicker": "join the pride",
    "comm.title": "Community",
    "comm.sub": "MeowArch is built in the open — come pet the code.",
    "comm1.title": "GitHub",
    "comm1.desc": "Star, fork, and follow development commit by commit.",
    "comm1.go": "github.com/MeowArch-open →",
    "comm2.title": "Documentation",
    "comm2.desc": "Install guides, device notes, and troubleshooting in one place.",
    "comm2.go": "read the docs →",
    "comm3.title": "Report an issue",
    "comm3.desc": "Found a hairball? Open an issue and we'll cough it up.",
    "comm3.go": "open an issue →",

    /* download page */
    "dl.crumb": "← back home",
    "dl.title_html": "Download <em>MeowArch</em>",
    "dl.sub": "Pick a flavor, pick a device, verify the checksum, and boot into something cozy.",
    "flavor.legend": "Choose your flavor",
    "flavor.desktop": "MeowArch Desktop",
    "flavor.desktop_desc": "The classic x86_64 live experience. Currently being groomed.",
    "flavor.mobile": "MeowArchMobile",
    "flavor.mobile_desc": "A full Arch userland running on your phone's hardware.",
    "flavor.on": "Available",
    "flavor.off": "Planned",
    "dl.devices.title": "Supported devices",
    "dl.devices.sub": "Builds are per-device. Choose yours to continue.",
    "dl.devices.loading": "Loading device list…",
    "dl.devices.offline": "Can't reach the API right now — showing the cached device list.",
    "dl.devices.all": "Open the full device page →",
    "dl.latest.title": "Latest mobile build",
    "dl.latest.sub": "Fresh from the release API.",
    "dl.verify.title": "Verify your download",
    "dl.verify.desc": "Always compare the SHA256 checksum before flashing. The official hash is published with every release and shown on the device page.",
    "dl.verify.cmd": "$ sha256sum your-download.img.zst",
    "dl.req.title": "Before you flash",
    "dl.req.sub": "MeowArchMobile replaces Android — bring a backup and a little courage.",
    "dl.req1_html": "<b>Unlocked bootloader</b> — required, no way around it",
    "dl.req2_html": "<b>12 GB+</b> free storage for the images",
    "dl.req3_html": "<b>ADB &amp; fastboot</b> working on your computer",
    "dl.req4_html": "<b>A full backup</b> of your data — seriously, everything",
    "dl.install_guide": "Full installation guide →",

    /* devices page */
    "dev.crumb": "← back home",
    "dev.title_html": "Choose your <em>device</em>",
    "dev.sub": "Every device gets its own carefully groomed build.",
    "dev.loading": "Fetching supported devices…",
    "dev.empty": "No devices are listed yet — the cat hid them all.",
    "dev.offline": "API unreachable — showing built-in device data.",
    "dev.pick": "Tap a device to load its latest build.",
    "dev.loading_release": "Loading the latest build for {model}…",
    "dev.no_release": "No release published for {model} yet. Check back soon!",
    "dev.load_failed": "Couldn't load the release. Is the API awake?",

    /* admin page */
    "ad.crumb": "← back home",
    "ad.title_html": "Data <em>management</em>",
    "ad.sub": "Maintainer tools — manage devices and publish builds via the Release API.",
    "ad.gate_title": "Maintainer access",
    "ad.gate_desc": "Paste your admin token to unlock device and release management. It stays in this browser tab only.",
    "ad.token_label": "Admin token",
    "ad.token_ph": "Bearer token from the API deployment",
    "ad.unlock": "Unlock",
    "ad.token_invalid": "That token didn't work. Check it and try again.",
    "ad.api_unreachable": "Can't reach the API: {msg}",
    "ad.sign_out": "Sign out",
    "ad.signed_out": "Signed out. The token has been dropped.",
    "ad.devices_title": "Devices",
    "ad.add_device": "Add device",
    "ad.empty_devices": "No devices yet. Add the first one.",
    "ad.loading_devices": "Loading devices…",
    "ad.release_btn": "Release",
    "ad.edit_btn": "Edit",
    "ad.delete_btn": "Delete",
    "ad.device_editor_add": "Add a device",
    "ad.device_editor_edit": "Edit {model}",
    "ad.flavor": "Flavor",
    "ad.flavor_mobile": "MeowArchMobile",
    "ad.flavor_desktop": "MeowArch Desktop",
    "ad.brand": "Brand",
    "ad.model": "Model",
    "ad.codename": "Codename",
    "ad.codename_hint": "Letters, digits, “-” and “_” only. Changing it creates a new device.",
    "ad.soc": "SoC",
    "ad.status": "Status",
    "ad.save": "Save device",
    "ad.cancel": "Cancel",
    "ad.saved_device": "Saved device “{model}”.",
    "ad.deleted": "Deleted device “{model}”.",
    "ad.save_failed": "Save failed: {msg}",
    "ad.delete_failed": "Delete failed: {msg}",
    "ad.delete_confirm": "Delete device “{model}” ({codename})?\n\nOnly the device entry is removed — published builds stay queryable.",
    "ad.release_title": "Release · {model}",
    "ad.loading_release": "Loading current release…",
    "ad.version": "Version",
    "ad.release_date": "Release date",
    "ad.channel": "Channel",
    "ad.mark_latest": "Mark as latest",
    "ad.iso_section": "Root filesystem image",
    "ad.torrent_section": "ESP / torrent image",
    "ad.boot_section": "Boot image",
    "ad.notes_section": "Notes",
    "ad.url": "URL",
    "ad.file_name": "File name",
    "ad.size": "Size",
    "ad.sha256": "SHA256",
    "ad.android_base": "Android base",
    "ad.kernel": "Kernel",
    "ad.publish": "Publish release",
    "ad.save_release": "Save release",
    "ad.no_release_yet": "No release published for this device yet — fill the form to publish the first one.",
    "ad.showing_version": "Editing current latest release ({version}).",
    "ad.saved_release": "Published {version} for {model}.",
    "ad.request_failed": "Request failed (HTTP {status})",
    "ad.close": "Close",
    "ad.ph.version": "v26.10",
    "ad.ph.date": "October 2026",
    "ad.ph.channel": "stable",
    "ad.ph.url": "https://…",
    "ad.ph.file": "meowarch-mobile.img.zst",
    "ad.ph.size": "4.93 GB",
    "ad.ph.sha": "64 hex characters",
    "ad.ph.android": "HyperOS 3",
    "ad.ph.kernel": "Linux 7.0.12",

    /* docs site chrome */
    "title.docs": "Documentation · MeowArch",
    "desc.docs": "MeowArch documentation — getting started, installation, FAQ and downloads.",
    "docs.crumb": "← main site",
    "docs.kicker": "documentation",
    "docs.hero_title_html": "MeowArch <em>docs</em>",
    "docs.hero_sub": "Everything you need to install, flash, and live with MeowArch — no scratches guaranteed.",
    "docs.guide": "Guide",
    "docs.quickstart": "Quick start",
    "docs.develop": "Development",
    "docs.download": "Downloads",
    "docs.read": "Read →",
    "docs.other": "Elsewhere",
    "docs.main_download": "Download page",
    "docs.devices": "Device list",
    "docs.community": "Community",
    "docs.on_this_page": "On this page",
    "docs.prev": "Previous",
    "docs.next": "Next",
    "docs.toc_empty": "No headings on this page.",
    "docs.loading": "Loading…",
    "docs.load_error": "Couldn't load this page — check your connection and try again.",
    "docs.retry": "Retry",
    "docs.copy": "Copy",
    "docs.copied": "Copied!",
    "docs.copy_md": "Copy Markdown",
    "docs.open": "Open",
    "docs.open_raw": "View Markdown source",
    "docs.open_chatgpt": "Open in ChatGPT",
    "docs.open_claude": "Open in Claude",
    "docs.ai_prompt": "Read this MeowArch docs page and help me understand it: {url}",
    "docs.latest_live": "Latest build (live)",
    "docs.latest_live_sub": "Fetched live from the MeowArch Release API.",
  };

  const zh = {
    /* titles + meta */
    "title.home": "MeowArch — 轻盈可爱的 Arch 体验",
    "title.download": "下载 · MeowArch",
    "title.devices": "选择你的设备 · MeowArch",
    "title.admin": "数据管理 · MeowArch",
    "desc.home": "MeowArch 是一个轻量、滚动、猫猫认证的 Arch Linux 体验，覆盖桌面与手机。",
    "desc.download": "获取最新的 MeowArch 构建，校验后启动一个温暖耐撸的系统。",
    "desc.devices": "选择你的 MeowArchMobile 设备，下载对应的构建。",
    "desc.admin": "MeowArch 发布数据管理 —— 设备与构建。",

    /* shared chrome */
    "aria.skip": "跳到正文",
    "aria.brand": "MeowArch 首页",
    "aria.nav": "主导航",
    "aria.theme": "切换明暗主题",
    "aria.menu": "打开导航菜单",
    "aria.github": "MeowArch 的 GitHub",
    "aria.lang": "语言",
    "nav.home": "首页",
    "nav.features": "特性",
    "nav.latest": "最新构建",
    "nav.news": "动态",
    "nav.download": "下载",
    "nav.docs": "文档",
    "nav.community": "社区",
    "brand.tagline": "轻盈如猫的 arch",
    "cta.download": "下载",
    "footer.tagline": "用 Arch、用心，加上一点轻轻的呼噜声。",
    "footer.docs": "文档",
    "footer.github": "GitHub",
    "footer.admin": "管理",
    "footer.back_top": "回到顶部 ↑",
    "footer.disclaimer": "MeowArch 是社区项目，与 Arch Linux 无隶属关系。MeowArchMobile 仅面向已解锁的设备，刷机有风险，请自行备份并谨慎操作。",
    "status.official": "官方支持",
    "status.community": "社区维护",

    /* home hero */
    "home.eyebrow": "喵~ 一个基于 Arch 的 Linux 发行版",
    "home.lede": "一个轻量、滚动的 Arch Linux 体验，像猫爪轻搭在键盘上——既属于你的桌面，也属于你口袋里的手机。",
    "home.cta_docs": "阅读文档",
    "pill.latest": "最新构建",
    "pill.loading": "正在询问 API……",
    "pill.offline": "请看下载页",

    /* terminal + stats */
    "stats.1v": "< 10 秒",
    "stats.1k": "冷启动",
    "stats.2v": "2 GB",
    "stats.2k": "最低内存",
    "stats.3v": "pacman",
    "stats.3k": "原生包管理",
    "stats.4v": "100%",
    "stats.4k": "可爱担保",

    /* features */
    "feat.kicker": "为什么选 meowarch",
    "feat.title": "小巧。迅捷。毛茸茸。",
    "feat.sub": "Arch 该有的一切都有，只是收起了会挠人的部分。",
    "feat1.title": "猫猫驱动",
    "feat1.desc": "融入了猫与可爱女孩子的灵魂，干劲随系统免费附赠。",
    "feat2.title": "轻量",
    "feat2.desc": "默认极简，性能拉满，没有躲在阴影里的臃肿组件。",
    "feat3.title": "高度可定制",
    "feat3.desc": "从内核到光标，一切任你驯化，随你揉捏。",
    "feat4.title": "可靠",
    "feat4.desc": "基于 Arch Linux，经社区测试，深受家猫崇拜。",

    /* latest build */
    "latest.kicker": "数据直连 API",
    "latest.title": "最新构建",
    "latest.sub": "由 MeowArch Release API 实时提供的发布数据。",
    "latest.loading": "正在从 API 获取最新构建……",
    "latest.offline": "API 正在打盹——先展示缓存信息，稍后再试。",
    "latest.retry": "重试",
    "latest.all_devices": "浏览全部设备 →",
    "release.flavor": "分支",
    "release.channel": "通道",
    "release.codename": "设备代号",
    "release.arch": "架构",
    "release.soc": "处理器",
    "release.base": "Android 底包",
    "release.kernel": "内核",
    "art.iso.name": "根文件系统",
    "art.torrent.name": "ESP 镜像",
    "art.boot.name": "引导镜像",
    "art.checksum": "SHA256 校验值",

    /* news */
    "news.kicker": "猫爬架上的新鲜事",
    "news.title": "动态",
    "news1.title": "MeowArchMobile v26.09 发布",
    "news1.sum": "基于 HyperOS 3 重建，内核 7.0.12——更顺滑、更冷静、更毛茸茸。",
    "news2.title": "设备支持持续增长",
    "news2.sum": "更多设备迎来官方构建，请关注设备页面。",
    "news3.title": "文档全面改版",
    "news3.sum": "安装指南重写，毛球更少，截图更多。",

    /* community */
    "comm.kicker": "加入猫群",
    "comm.title": "社区",
    "comm.sub": "MeowArch 完全开放开发——来摸摸代码。",
    "comm1.title": "GitHub",
    "comm1.desc": "Star、Fork，逐个 commit 跟进开发。",
    "comm1.go": "github.com/MeowArch-open →",
    "comm2.title": "文档",
    "comm2.desc": "安装指南、设备说明与排障手册，一站看全。",
    "comm2.go": "阅读文档 →",
    "comm3.title": "反馈问题",
    "comm3.desc": "发现毛球？提个 Issue，我们负责咳出来。",
    "comm3.go": "提交 Issue →",

    /* download page */
    "dl.crumb": "← 返回首页",
    "dl.title_html": "下载 <em>MeowArch</em>",
    "dl.sub": "选好分支，选好设备，校验通过，然后启动一个温暖耐撸的系统。",
    "flavor.legend": "选择你的分支",
    "flavor.desktop": "MeowArch 桌面版",
    "flavor.desktop_desc": "经典的 x86_64 Live 体验，目前正在梳毛中。",
    "flavor.mobile": "MeowArchMobile",
    "flavor.mobile_desc": "在你手机的硬件上运行完整的 Arch 用户态。",
    "flavor.on": "可用",
    "flavor.off": "筹备中",
    "dl.devices.title": "支持的设备",
    "dl.devices.sub": "构建按设备提供，选择你的设备继续。",
    "dl.devices.loading": "正在加载设备列表……",
    "dl.devices.offline": "暂时连不上 API——先展示缓存的设备列表。",
    "dl.devices.all": "打开完整设备页 →",
    "dl.latest.title": "最新移动构建",
    "dl.latest.sub": "发布 API 现烤出炉。",
    "dl.verify.title": "校验你的下载",
    "dl.verify.desc": "刷入前务必核对 SHA256 校验值。官方哈希随每个版本发布，并展示在设备页。",
    "dl.verify.cmd": "$ sha256sum 你的下载文件.img.zst",
    "dl.req.title": "刷入之前",
    "dl.req.sub": "MeowArchMobile 会替换 Android——请备份数据，并带上一点点勇气。",
    "dl.req1_html": "<b>已解锁 Bootloader</b> —— 硬性前提，无路可绕",
    "dl.req2_html": "<b>12 GB+</b> 可用存储空间存放镜像",
    "dl.req3_html": "<b>ADB 与 fastboot</b> 可在电脑上正常使用",
    "dl.req4_html": "<b>完整的数据备份</b> —— 是认真的，全部都要",
    "dl.install_guide": "完整安装指南 →",

    /* devices page */
    "dev.crumb": "← 返回首页",
    "dev.title_html": "选择你的<em>设备</em>",
    "dev.sub": "每台设备都有专属精心打理的构建。",
    "dev.loading": "正在获取支持的设备……",
    "dev.empty": "暂时没有设备——全被猫藏起来了。",
    "dev.offline": "API 无法访问——展示内置设备数据。",
    "dev.pick": "点按设备查看其最新构建。",
    "dev.loading_release": "正在加载 {model} 的最新构建……",
    "dev.no_release": "{model} 还没有发布版本，晚点再来看看！",
    "dev.load_failed": "加载发布信息失败。API 醒着吗？",

    /* admin page */
    "ad.crumb": "← 返回首页",
    "ad.title_html": "数据<em>管理</em>",
    "ad.sub": "维护者工具——通过 Release API 管理设备并发布构建。",
    "ad.gate_title": "维护者登录",
    "ad.gate_desc": "粘贴管理员令牌以解锁设备与发布管理。令牌只保存在当前浏览器标签页。",
    "ad.token_label": "管理员令牌",
    "ad.token_ph": "来自 API 部署的 Bearer 令牌",
    "ad.unlock": "解锁",
    "ad.token_invalid": "令牌无效，请检查后重试。",
    "ad.api_unreachable": "无法连接 API：{msg}",
    "ad.sign_out": "退出登录",
    "ad.signed_out": "已退出，令牌已清除。",
    "ad.devices_title": "设备",
    "ad.add_device": "新增设备",
    "ad.empty_devices": "还没有设备，来添加第一台。",
    "ad.loading_devices": "正在加载设备……",
    "ad.release_btn": "发布",
    "ad.edit_btn": "编辑",
    "ad.delete_btn": "删除",
    "ad.device_editor_add": "新增设备",
    "ad.device_editor_edit": "编辑 {model}",
    "ad.flavor": "分支",
    "ad.flavor_mobile": "MeowArchMobile",
    "ad.flavor_desktop": "MeowArch 桌面版",
    "ad.brand": "品牌",
    "ad.model": "型号",
    "ad.codename": "设备代号",
    "ad.codename_hint": "仅限字母、数字、“-”和“_”。修改代号等于新建设备。",
    "ad.soc": "处理器",
    "ad.status": "状态",
    "ad.save": "保存设备",
    "ad.cancel": "取消",
    "ad.saved_device": "已保存设备“{model}”。",
    "ad.deleted": "已删除设备“{model}”。",
    "ad.save_failed": "保存失败：{msg}",
    "ad.delete_failed": "删除失败：{msg}",
    "ad.delete_confirm": "确定删除设备“{model}”({codename})？\n\n只会删除设备条目——已发布的构建仍可查询。",
    "ad.release_title": "发布 · {model}",
    "ad.loading_release": "正在加载当前发布……",
    "ad.version": "版本",
    "ad.release_date": "发布日期",
    "ad.channel": "通道",
    "ad.mark_latest": "标记为最新版",
    "ad.iso_section": "根文件系统镜像",
    "ad.torrent_section": "ESP / 种子镜像",
    "ad.boot_section": "引导镜像",
    "ad.notes_section": "备注",
    "ad.url": "URL",
    "ad.file_name": "文件名",
    "ad.size": "体积",
    "ad.sha256": "SHA256",
    "ad.android_base": "Android 底包",
    "ad.kernel": "内核",
    "ad.publish": "发布新版本",
    "ad.save_release": "保存发布",
    "ad.no_release_yet": "该设备还没有发布版本——填写表单发布第一个吧。",
    "ad.showing_version": "正在编辑当前最新版（{version}）。",
    "ad.saved_release": "已为 {model} 发布 {version}。",
    "ad.request_failed": "请求失败（HTTP {status}）",
    "ad.close": "关闭",
    "ad.ph.version": "v26.10",
    "ad.ph.date": "2026 年 10 月",
    "ad.ph.channel": "stable",
    "ad.ph.url": "https://…",
    "ad.ph.file": "meowarch-mobile.img.zst",
    "ad.ph.size": "4.93 GB",
    "ad.ph.sha": "64 位十六进制",
    "ad.ph.android": "HyperOS 3",
    "ad.ph.kernel": "Linux 7.0.12",

    /* docs site chrome */
    "title.docs": "文档 · MeowArch",
    "desc.docs": "MeowArch 文档 —— 快速开始、安装、FAQ 与下载。",
    "docs.crumb": "← 返回主站",
    "docs.kicker": "文档",
    "docs.hero_title_html": "MeowArch <em>文档</em>",
    "docs.hero_sub": "安装、刷机、与 MeowArch 一起生活所需的一切——保证不被挠。",
    "docs.guide": "指南",
    "docs.quickstart": "快速开始",
    "docs.develop": "开发文档",
    "docs.download": "下载",
    "docs.read": "阅读 →",
    "docs.other": "站内其他",
    "docs.main_download": "下载页",
    "docs.devices": "设备列表",
    "docs.community": "社区",
    "docs.on_this_page": "本页目录",
    "docs.prev": "上一篇",
    "docs.next": "下一篇",
    "docs.toc_empty": "本页没有小节。",
    "docs.loading": "正在加载……",
    "docs.load_error": "无法加载本页——请检查网络后重试。",
    "docs.retry": "重试",
    "docs.copy": "复制",
    "docs.copied": "已复制！",
    "docs.copy_md": "复制 Markdown",
    "docs.open": "打开",
    "docs.open_raw": "查看 Markdown 源码",
    "docs.open_chatgpt": "在 ChatGPT 中打开",
    "docs.open_claude": "在 Claude 中打开",
    "docs.ai_prompt": "请阅读这篇 MeowArch 文档并帮我理解：{url}",
    "docs.latest_live": "最新构建（实时）",
    "docs.latest_live_sub": "由 MeowArch Release API 实时提供。",
  };

  const dicts = { en, "zh-CN": zh };

  // Fold in the generator's per-document strings (docs/docs-i18n.js, loaded
  // just before this file). Keeps the docs pages content-driven: their
  // sidebar / card / pager / <title> text lives in frontmatter, not here.
  if (globalThis.MEOWARCH_DOCS_I18N) {
    for (const code of Object.keys(dicts)) {
      const extra = globalThis.MEOWARCH_DOCS_I18N[code];
      if (extra) Object.assign(dicts[code], extra);
    }
  }

  let lang = detect();

  function detect() {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang && dicts[urlLang]) return urlLang;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && dicts[stored]) return stored;
    } catch {}
    const candidates = navigator.languages || [navigator.language || "en"];
    for (const tag of candidates) {
      if (/^zh\b|-?hans/i.test(tag)) return "zh-CN";
      if (/^en\b/i.test(tag)) return "en";
    }
    return "en";
  }

  function interpolate(template, params) {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m,
    );
  }

  function t(key, params) {
    const value = dicts[lang][key] ?? en[key] ?? key;
    return interpolate(value, params);
  }

  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    root.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      el.setAttribute("alt", t(el.dataset.i18nAlt));
    });
    const titleKey = document.documentElement.dataset.i18nTitle;
    if (titleKey) document.title = t(titleKey);
    const metaKey = document.querySelector('meta[name="description"]')?.dataset?.i18nMeta;
    const metaEl = document.querySelector('meta[name="description"]');
    if (metaEl && metaKey) metaEl.setAttribute("content", t(metaKey));
  }

  function setLang(next) {
    if (!dicts[next] || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    document.documentElement.lang = next;
    apply();
    document.querySelectorAll(".lang-select").forEach((el) => {
      el.value = next;
    });
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { lang: next } }));
  }

  document.querySelectorAll(".lang-select").forEach((el) => {
    el.value = lang;
    el.addEventListener("change", () => setLang(el.value));
  });

  document.documentElement.lang = lang;
  apply();

  return { t, apply, setLang, getLang: () => lang };
})();
