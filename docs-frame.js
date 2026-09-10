(() => {
  const frame = document.querySelector("#docs-frame");
  const frameWrap = document.querySelector(".docs-frame-wrap");
  const status = document.querySelector("#docs-frame-status");

  if (!frame || !frame.contentWindow) return;

  const PUBLIC_BASE = "/docs";
  const INTERNAL_BASE = "/docs-content";
  const CHILD_SOURCE = "meowarch-docs-frame";
  const SHELL_SOURCE = "meowarch-docs-shell";
  const PROTOCOL_VERSION = 1;
  let ready = false;

  const normalizeRoute = (value) => {
    if (typeof value !== "string" || value.includes("\\")) return null;

    let route;
    try {
      route = decodeURIComponent(value);
    } catch {
      return null;
    }

    if (!route.startsWith("/") || route.startsWith("//")) return null;
    if (/\0|(^|\/)\.\.?(\/|$)|:/.test(route)) return null;

    const normalized = route.replace(/\/{2,}/g, "/");
    return normalized === "/index.html" ? "/" : normalized;
  };

  const publicRoute = () => {
    const { pathname } = window.location;
    if (pathname === PUBLIC_BASE || pathname === `${PUBLIC_BASE}/`) {
      return "/guide/getting-started.html";
    }
    if (!pathname.startsWith(`${PUBLIC_BASE}/`)) return "/";
    return normalizeRoute(pathname.slice(PUBLIC_BASE.length)) || "/";
  };

  const internalUrl = (route, hash = window.location.hash) => {
    const path = route === "/" ? `${INTERNAL_BASE}/` : `${INTERNAL_BASE}${route}`;
    return `${path}${hash || ""}`;
  };

  const publicUrl = (route, hash = "") => {
    const path = route === "/" ? `${PUBLIC_BASE}/` : `${PUBLIC_BASE}${route}`;
    return `${path}${hash || ""}`;
  };

  const currentTheme = () =>
    document.body.classList.contains("night-mode") ? "night" : "light";

  const postToFrame = (message) => {
    frame.contentWindow?.postMessage(
      {
        source: SHELL_SOURCE,
        version: PROTOCOL_VERSION,
        ...message,
      },
      window.location.origin,
    );
  };

  const sendTheme = () => {
    postToFrame({ type: "SET_THEME", theme: currentTheme() });
  };

  const showReady = () => {
    ready = true;
    frameWrap?.classList.add("is-loaded");
    if (status) status.hidden = true;
  };

  frame.src = internalUrl(publicRoute());

  frame.addEventListener("load", () => {
    frameWrap?.classList.add("is-loaded");
    sendTheme();
  });

  window.addEventListener("message", (event) => {
    if (
      event.origin !== window.location.origin ||
      event.source !== frame.contentWindow ||
      !event.data ||
      event.data.source !== CHILD_SOURCE ||
      event.data.version !== PROTOCOL_VERSION
    ) {
      return;
    }

    if (event.data.type === "READY") {
      showReady();
      sendTheme();
      return;
    }

    if (event.data.type !== "ROUTE_CHANGED") return;

    const route = normalizeRoute(event.data.route);
    const hash = typeof event.data.hash === "string" && event.data.hash.startsWith("#")
      ? event.data.hash
      : "";
    if (!route) return;

    const nextUrl = publicUrl(route, hash);
    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
    if (typeof event.data.title === "string" && event.data.title.trim()) {
      document.title = event.data.title;
    }
    showReady();
  });

  window.addEventListener("popstate", () => {
    postToFrame({
      type: "NAVIGATE",
      route: publicRoute(),
      hash: window.location.hash,
    });
  });

  window.addEventListener("meowarch:themechange", sendTheme);

  window.setTimeout(() => {
    if (ready || !status) return;
    status.textContent = "Documentation is taking longer than expected to load.";
    status.hidden = false;
  }, 12000);
})();
