/* MeowArch i18n — en / zh-CN dictionaries, DOM apply, language switcher.
   Load this BEFORE script.js / devices.js / admin.js. */
window.MEOWARCH_I18N = (() => {
  const STORAGE_KEY = "meowarch_lang";

  const en = {
    /* titles + meta */
    "title.home": "MeowArch | Purrfectly Minimal Arch",
    "title.download": "MeowArch | Download",
    "title.devices": "MeowArch | Choose Your Device",
    "title.admin": "MeowArch | Data Management",
    "meta.home": "MeowArch is a purrfectly minimal Arch Linux experience.",
    "meta.download":
      "Download the MeowArch ISO, verify checksums, and start purring.",
    "meta.devices":
      "Choose your MeowArchMobile device and grab the matching build.",
    "meta.admin": "MeowArch data management — devices and release info.",

    /* shared chrome */
    "brand.tagline": "Purrfectly Minimal Arch",
    "lang.label": "Language",
    "aria.brand": "MeowArch home",
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.download": "Download",
    "nav.docs": "Docs",
    "nav.community": "Community",
    "aria.nav": "Primary navigation",
    "aria.theme": "Switch theme",
    "aria.github": "MeowArch on GitHub",
    "aria.menu": "Open navigation",
    "cta.get_started": "Get Started",
    "footer.tagline": "Built with Arch, care, and a little purr.",
    "footer.back_top_html": 'Back to top <span aria-hidden="true">↑</span>',
    "pill.latest": "Latest Release:",

    /* index page */
    "hero.subtitle": "A Purrfectly Minimal Arch Linux Experience",
    "hero.desc_html":
      "MeowArch is an Arch Linux distribution with a cute twist.<br >Lightweight, fast, and customizable — just like a cat.",
    "hero.download_now": "Download Now",
    "hero.view_docs": "View Documentation",
    "hero.art_alt": "White-haired cat girl in a white hoodie with blue eyes",
    "feat.panel_aria": "MeowArch features",
    "feat1.title": "Cat-Powered",
    "feat1.desc_html": "Infused with the spirit<br >of cats and cute girls.",
    "feat2.title": "Lightweight",
    "feat2.desc_html": "Minimal by default,<br >heavy on performance.",
    "feat3.title": "Customizable",
    "feat3.desc_html": "Make it yours with<br >endless possibilities.",
    "feat4.title": "Reliable",
    "feat4.desc_html": "Built on Arch Linux,<br >tested by the community.",
    "lower.aria": "MeowArch overview and news",
    "promo.art_alt": "White cat peeking through the Arch Linux mark",
    "promo.title_html": "Arch Linux,<br ><span>Meow Style</span>",
    "promo.desc_html":
      'All the power and elegance of Arch<br class="desktop-only" >Linux, with a touch of cuteness.<br class="desktop-only" >Stay productive, stay adorable.',
    "news.latest": "Latest News",
    "news.view_all": "View All",
    "news1.title": "MeowArch v1.0.0 Released!",
    "news1.date": "Aug 25",
    "news1.summary": "The first stable release is here!",
    "news2.title": "New Installer Update",
    "news2.date": "Aug 18",
    "news2.summary": "Easier installation with cute progress!",
    "news3.title": "Community Highlights",
    "news3.date": "Aug 10",
    "news3.summary": "Thanks to all contributors!",
    "res.aria": "Getting started resources",
    "res.download_title": "Download MeowArch",
    "res.download_desc": "Grab the latest ISO and start exploring.",
    "res.iso_mirrors_html": 'ISO mirrors <span aria-hidden="true">↗</span>',
    "res.start_title": "Start with confidence",
    "res.start_desc": "Follow the friendly install guide.",
    "res.read_docs_html": 'Read docs <span aria-hidden="true">→</span>',

    /* download page */
    "d.title_html": "Download <span>Meow</span><strong>Arch</strong>",
    "d.subtitle": "Purrfectly Minimal, Ready to Purr.",
    "d.desc_html":
      'Grab the latest MeowArch ISO, verify it, and boot into a<br class="desktop-only" >lightweight, cat-approved Arch experience.',
    "d.download_iso": "Supported Devices",
    "d.install_guide": "Install Guide",
    "d.choose_flavor": "Choose your flavor",
    "d.flavor_desktop_unavailable": "MeowArch Desktop (Not available)",
    "d.flavor_mobile": "MeowArchMobile",
    "d.flavor_availability_help": "MeowArch Desktop is not available. MeowArchMobile is available.",
    "d.no_available": "No available",
    "d.res_iso_title": "MeowArch ISO",
    "d.res_torrent": "Torrent",
    "d.res_torrent_desc": "Peer-to-peer download, purr-fectly fast.",
    "d.res_mirrors_title": "Mirrors",
    "d.res_mirrors_desc": "Fast worldwide mirrors, closer to your whiskers.",
    "d.btn_mirrors_html": 'Mirrors <span aria-hidden="true">↗</span>',
    "d.btn_torrent_html": 'Get torrent <span aria-hidden="true">↗</span>',
    "d.btn_mirror_list_html": 'Mirror list <span aria-hidden="true">↗</span>',
    "checksum.title": "Verify Your Download",
    "checksum.desc":
      "Always check the SHA256 checksum before you boot. Official checksums are published with every release.",
    "aria.checksum": "SHA256 checksum command",
    "checksum.aria": "ISO verification",
    "req.title_html": "System<br >Requirements",
    "req.aria": "System requirements",
    "req.cpu_html": "<strong>64-bit</strong> x86-64 CPU",
    "req.ram_html": "<strong>2 GB</strong> RAM minimum",
    "req.disk_html": "<strong>20 GB</strong> free disk space",
    "req.usb_html": "<strong>USB drive</strong> 4 GB+ for the live ISO",

    /* devices page */
    "devices.back_html": '<span aria-hidden="true">←</span> Back to downloads',
    "devices.title_html": "Choose Your <strong>Device</strong>",
    "devices.subtitle":
      "Pick your MeowArchMobile flavor and grab the matching build.",
    "devices.list_aria": "Supported devices",
    "devices.card_aria": "Download for {model}",
    "devices.card_unavailable_aria": "{model}, not available",
    "devices.not_available": "Not available",
    loading_devices: "Loading devices…",
    offline_warning:
      "API offline — showing cached devices. Release info may be unavailable.",
    empty_devices: "No devices listed yet. Meow?",
    retry: "Retry",
    "status.official": "official",
    "status.community": "community",
    loading_release: "Loading release info for {model}…",
    no_release: "No release available for {model} yet. Meow!",
    load_release_failed:
      "Couldn't load release info (API offline?). Try again later.",
    "detail.channel": "Channel:",
    "detail.codename": "Codename:",
    "detail.arch": "Arch:",
    "detail.soc": "SoC:",
    "detail.torrent": "Torrent",
    "detail.boot_image_html":
      'Boot image ({name}) <span aria-hidden="true">↗</span>',
    "detail.android_base": "Android base:",
    "detail.kernel": "Kernel:",

    /* admin page */
    "admin.back_html": '<span aria-hidden="true">←</span> Back to devices',
    "admin.title_html": "Data <strong>Management</strong>",
    "admin.subtitle": "Add, edit and remove devices and their release info.",
    "a.auth_aria": "Sign in",
    "a.token_title": "Admin token",
    "a.token_hint_html":
      "Paste your API admin token (your <code>ADMIN_SECRET_KEY</code>, or the dev token printed at startup). It is kept only in this tab's session.",
    "a.token_label": "Bearer token",
    "a.token_placeholder": "Paste admin token…",
    "a.unlock": "Unlock",
    "a.sign_out": "Sign out",
    "a.add_device": "＋ Add device",
    "a.devices": "Devices",
    "a.manager_aria": "Device management",
    "a.editor_aria": "Device editor",
    "a.release_info": "Release info",
    "a.release_title": "Release info — {model}",
    "a.release_aria": "Release editor",
    "a.close": "Close",
    "a.empty_devices": "No devices yet. Add one to get started.",
    "a.edit_btn": "Edit",
    "a.delete_btn": "Delete",
    "a.release_btn": "Release",
    "a.delete_confirm":
      "Delete {model} ({codename})? Its release records are kept.",
    "a.deleted": "Deleted {model}.",
    "a.save_failed": "Save failed: {msg}",
    "a.delete_failed": "Delete failed: {msg}",
    "a.saved_device": "Saved {model}.",
    "a.edit_title_add": "Add device",
    "a.edit_title_edit": "Edit {model}",
    "a.flavor": "Flavor",
    "a.opt_mobile": "MeowArchMobile",
    "a.opt_desktop": "MeowArch (desktop)",
    "a.brand": "Brand *",
    "a.model": "Model *",
    "a.codename": "Codename *",
    "a.codename_note_html":
      "Letters, digits, <code>_</code> and <code>-</code> only. Locked after creation.",
    "a.soc": "SoC",
    "a.status": "Status",
    "a.status_official": "Official",
    "a.status_community": "Community",
    "a.save_device": "Save device",
    "a.cancel": "Cancel",
    "a.loading_release": "Loading release info…",
    "a.load_release_failed": "Couldn't load release info: {msg}",
    "a.no_release_yet":
      "This device has no release yet — publish the first one.",
    "a.showing_version":
      "Currently showing {version} — saving upserts by flavor + codename + version.",
    "a.publish_release": "Publish release",
    "a.save_release": "Save release",
    "a.saved_release": "Saved {version} for {model}. ✓",
    "a.version": "Version *",
    "a.release_date": "Release date",
    "a.channel": "Channel",
    "a.mark_latest": "Mark as latest",
    "a.iso": "ISO",
    "a.torrent": "Torrent",
    "a.boot_image": "Boot image",
    "a.notes": "Notes",
    "a.url": "URL",
    "a.file_name": "File name",
    "a.size": "Size",
    "a.sha256": "SHA256",
    "a.android_base": "Android base",
    "a.kernel": "Kernel",
    "a.signed_out": "Signed out.",
    "a.token_invalid": "Token expired or invalid — please sign in again.",
    "a.api_unreachable": "Couldn't reach the API: {msg}",
    "a.request_failed": "Request failed ({status})",
  };

  const zhCN = {
    /* titles + meta */
    "title.home": "MeowArch | 极简优雅的 Arch",
    "title.download": "MeowArch | 下载",
    "title.devices": "MeowArch | 选择设备",
    "title.admin": "MeowArch | 数据管理",
    "meta.home": "MeowArch 是一个极简优雅的 Arch Linux 发行版。",
    "meta.download": "下载 MeowArch ISO，校验文件，开始你的喵级体验。",
    "meta.devices": "选择你的 MeowArchMobile 设备，获取对应的构建。",
    "meta.admin": "MeowArch 数据管理——设备与版本信息。",

    /* shared chrome */
    "brand.tagline": "极简优雅的 Arch",
    "lang.label": "语言",
    "aria.brand": "MeowArch 首页",
    "nav.home": "首页",
    "nav.features": "特性",
    "nav.download": "下载",
    "nav.docs": "文档",
    "nav.community": "社区",
    "aria.nav": "主导航",
    "aria.theme": "切换主题",
    "aria.github": "MeowArch 的 GitHub 仓库",
    "aria.menu": "打开导航",
    "cta.get_started": "快速开始",
    "footer.tagline": "用 Arch、用心与一点点喵声打造。",
    "footer.back_top_html": '回到顶部 <span aria-hidden="true">↑</span>',
    "pill.latest": "最新版本：",

    /* index page */
    "hero.subtitle": "一个极简优雅的 Arch Linux 体验",
    "hero.desc_html":
      "MeowArch 是一个带有可爱特色的 Arch Linux 发行版。<br >轻量、快速、可定制——就像猫一样。",
    "hero.download_now": "立即下载",
    "hero.view_docs": "查看文档",
    "hero.art_alt": "白发的猫娘，身穿白色卫衣，蓝色眼睛",
    "feat.panel_aria": "MeowArch 特性",
    "feat1.title": "猫力驱动",
    "feat1.desc_html": "注入猫猫与可爱少女<br >的满满元气。",
    "feat2.title": "超轻量",
    "feat2.desc_html": "默认极简，<br >性能拉满。",
    "feat3.title": "可定制",
    "feat3.desc_html": "无尽玩法，<br >打造属于你的系统。",
    "feat4.title": "稳定可靠",
    "feat4.desc_html": "基于 Arch Linux，<br >由社区共同打磨。",
    "lower.aria": "MeowArch 概览与动态",
    "promo.art_alt": "白猫从 Arch Linux 标志后探出头",
    "promo.title_html": "Arch Linux，<br ><span>喵式风格</span>",
    "promo.desc_html":
      'Arch 的全部力量与优雅，<br class="desktop-only" >再加上一点可爱。<br class="desktop-only" >保持高效，保持可爱。',
    "news.latest": "最新动态",
    "news.view_all": "查看全部",
    "news1.title": "MeowArch v1.0.0 正式发布！",
    "news1.date": "8 月 25 日",
    "news1.summary": "首个稳定版本终于来了！",
    "news2.title": "安装器迎来更新",
    "news2.date": "8 月 18 日",
    "news2.summary": "安装更简单，进度条也更可爱！",
    "news3.title": "社区精选",
    "news3.date": "8 月 10 日",
    "news3.summary": "感谢所有贡献者！",
    "res.aria": "上手资源",
    "res.download_title": "下载 MeowArch",
    "res.download_desc": "获取最新 ISO，开始探索。",
    "res.iso_mirrors_html": 'ISO 镜像 <span aria-hidden="true">↗</span>',
    "res.start_title": "放心上手",
    "res.start_desc": "跟着友好的安装指南走。",
    "res.read_docs_html": '阅读文档 <span aria-hidden="true">→</span>',

    /* download page */
    "d.title_html": "下载 <span>Meow</span><strong>Arch</strong>",
    "d.subtitle": "极简优雅，即刻开喵。",
    "d.desc_html":
      '下载最新的 MeowArch ISO，完成校验后启动一个<br class="desktop-only" >轻量、喵认可的 Arch 体验。',
    "d.download_iso": "支持的设备",
    "d.install_guide": "安装指南",
    "d.choose_flavor": "选择你的口味",
    "d.flavor_desktop_unavailable": "MeowArch Desktop（暂不可用）",
    "d.flavor_mobile": "MeowArchMobile",
    "d.flavor_availability_help": "MeowArch Desktop 暂不可用。MeowArchMobile 可用。",
    "d.no_available": "无可用选项",
    "d.res_iso_title": "MeowArch ISO",
    "d.res_torrent": "ESP",
    "d.res_torrent_desc": "点对点下载，同样飞快。",
    "d.res_mirrors_title": "镜像站",
    "d.res_mirrors_desc": "遍布全球的快速镜像，离你的胡须更近。",
    "d.btn_mirrors_html": '镜像 <span aria-hidden="true">↗</span>',
    "d.btn_torrent_html": 'ESP <span aria-hidden="true">↗</span>',
    "d.btn_mirror_list_html": '镜像列表 <span aria-hidden="true">↗</span>',
    "checksum.title": "校验你的下载",
    "checksum.desc":
      "启动之前，请务必校验 SHA256 校验值。官方校验值随每个版本一同发布。",
    "aria.checksum": "SHA256 校验命令",
    "checksum.aria": "ISO 校验",
    "req.title_html": "系统<br >要求",
    "req.aria": "系统要求",
    "req.cpu_html": "<strong>64 位</strong> x86-64 CPU",
    "req.ram_html": "<strong>2 GB</strong> 内存起步",
    "req.disk_html": "<strong>20 GB</strong> 可用磁盘空间",
    "req.usb_html": "<strong>U 盘</strong> 4 GB 以上（用于 live ISO）",

    /* devices page */
    "devices.back_html": '<span aria-hidden="true">←</span> 返回下载页',
    "devices.title_html": "选择你的<strong>设备</strong>",
    "devices.subtitle": "选择你的 MeowArchMobile 口味，获取对应的构建。",
    "devices.list_aria": "支持的设备",
    "devices.card_aria": "下载 {model}",
    "devices.card_unavailable_aria": "{model}，暂不可用",
    "devices.not_available": "暂不可用",
    loading_devices: "正在加载设备…",
    offline_warning: "API 离线——显示缓存设备，版本信息可能不可用。",
    empty_devices: "还没有任何设备。喵？",
    retry: "重试",
    "status.official": "官方",
    "status.community": "社区",
    loading_release: "正在加载 {model} 的版本信息…",
    no_release: "{model} 暂无可用版本。喵！",
    load_release_failed: "无法加载版本信息（API 离线？）。请稍后重试。",
    "detail.channel": "渠道：",
    "detail.codename": "代号：",
    "detail.arch": "架构：",
    "detail.soc": "处理器：",
    "detail.torrent": "ESP",
    "detail.boot_image_html":
      '启动镜像（{name}）<span aria-hidden="true">↗</span>',
    "detail.android_base": "Android 基础：",
    "detail.kernel": "内核：",

    /* admin page */
    "admin.back_html": '<span aria-hidden="true">←</span> 返回设备页',
    "admin.title_html": "数据<strong>管理</strong>",
    "admin.subtitle": "新增、编辑与删除设备及其版本信息。",
    "a.auth_aria": "登录",
    "a.token_title": "管理员令牌",
    "a.token_hint_html":
      "粘贴 API 管理员令牌（你的 <code>ADMIN_SECRET_KEY</code>，或启动时打印的开发令牌）。它只保存在当前标签页的会话中。",
    "a.token_label": "Bearer 令牌",
    "a.token_placeholder": "粘贴管理员令牌…",
    "a.unlock": "解锁",
    "a.sign_out": "退出登录",
    "a.add_device": "＋ 新增设备",
    "a.devices": "设备",
    "a.manager_aria": "设备管理",
    "a.editor_aria": "设备编辑器",
    "a.release_info": "版本信息",
    "a.release_title": "版本信息——{model}",
    "a.release_aria": "版本编辑",
    "a.close": "关闭",
    "a.empty_devices": "还没有设备，先添加一个吧。",
    "a.edit_btn": "编辑",
    "a.delete_btn": "删除",
    "a.release_btn": "版本",
    "a.delete_confirm": "删除 {model}（{codename}）？其版本记录将保留。",
    "a.deleted": "已删除 {model}。",
    "a.save_failed": "保存失败：{msg}",
    "a.delete_failed": "删除失败：{msg}",
    "a.saved_device": "已保存 {model}。",
    "a.edit_title_add": "新增设备",
    "a.edit_title_edit": "编辑 {model}",
    "a.flavor": "版本类型",
    "a.opt_mobile": "MeowArchMobile",
    "a.opt_desktop": "MeowArch（桌面）",
    "a.brand": "品牌 *",
    "a.model": "型号 *",
    "a.codename": "代号 *",
    "a.codename_note_html":
      "仅限字母、数字、<code>_</code> 与 <code>-</code>。创建后不可更改。",
    "a.soc": "处理器",
    "a.status": "状态",
    "a.status_official": "官方",
    "a.status_community": "社区",
    "a.save_device": "保存设备",
    "a.cancel": "取消",
    "a.loading_release": "正在加载版本信息…",
    "a.load_release_failed": "无法加载版本信息：{msg}",
    "a.no_release_yet": "该设备还没有版本——发布第一个吧。",
    "a.showing_version":
      "当前显示 {version}——保存将按 flavor + codename + version 更新。",
    "a.publish_release": "发布版本",
    "a.save_release": "保存版本",
    "a.saved_release": "已保存 {model} 的 {version}。✓",
    "a.version": "版本号 *",
    "a.release_date": "发布日期",
    "a.channel": "渠道",
    "a.mark_latest": "标记为最新",
    "a.iso": "ISO",
    "a.torrent": "ESP",
    "a.boot_image": "启动镜像",
    "a.notes": "备注",
    "a.url": "URL",
    "a.file_name": "文件名",
    "a.size": "大小",
    "a.sha256": "SHA256",
    "a.android_base": "Android 基础",
    "a.kernel": "内核",
    "a.signed_out": "已退出登录。",
    "a.token_invalid": "令牌已过期或无效——请重新登录。",
    "a.api_unreachable": "无法连接 API：{msg}",
    "a.request_failed": "请求失败（{status}）",
  };

  const dicts = { en, "zh-CN": zhCN };

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && dicts[saved]) return saved;
    } catch {
      /* storage unavailable — fall through to navigator detection */
    }
    const nav = (navigator.language || "en").toLowerCase();
    return nav.startsWith("zh") ? "zh-CN" : "en";
  }

  let current = detect();

  function t(key, params) {
    const text =
      (dicts[current] && dicts[current][key]) || dicts.en[key] || key;
    if (!params) return text;
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      text,
    );
  }

  function apply() {
    const lang = current;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute(
        "placeholder",
        t(el.getAttribute("data-i18n-placeholder")),
      );
    });
    document.querySelectorAll("[data-i18n-meta]").forEach((el) => {
      el.setAttribute("content", t(el.getAttribute("data-i18n-meta")));
    });
    const titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey);
    const switcher = document.querySelector(".lang-select");
    if (switcher) switcher.value = lang;
    window.dispatchEvent(
      new CustomEvent("meowarch:langchange", { detail: lang }),
    );
  }

  function setLanguage(lang) {
    if (!dicts[lang]) return;
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    apply();
  }

  /* switcher wiring (present on every page shell) */
  const switcher = document.querySelector(".lang-select");
  if (switcher) {
    switcher.addEventListener("change", () => {
      setLanguage(switcher.value);
    });
  }

  apply(); // translate static DOM immediately (scripts load at end of body)

  return {
    t,
    apply,
    setLanguage,
    getLanguage: () => current,
    supported: Object.keys(dicts),
  };
})();
