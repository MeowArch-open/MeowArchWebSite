/* MeowArch Release API endpoint — the one place to change the API base.
   The live deployment is https://api.meowarch.top/api/v1 (public + admin routes).
   Override at runtime by defining window.MEOWARCH_API_BASE before this file. */
window.MEOWARCH_API_BASE = "https://api.meowarch.top/api/v1";

/* Optional ICP filing notice fixed to the bottom of every page.
   Set enabled to true and fill number, then set badgeUrl to an optional
   badge image URL. The filing number link always uses the MIIT redirect. */
window.MEOWARCH_FILING = {
  enabled: false,
  number: "",
  badgeUrl: "",
  link: "https://beian.miit.gov.cn/",
};
