/* Shared UI behaviour: theme (dark-first), topbar scroll state, mobile
   menu, scroll-reveal animations, and the terminal typing effect. */
(() => {
  "use strict";

  const THEME_KEY = "meowarch_theme";
  const CHANGE_EVENT = "meowarch:themechange";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- theme (default: dark) ---- */
  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document
      .querySelectorAll(".theme-toggle")
      .forEach((btn) => btn.setAttribute("aria-pressed", String(theme === "dark")));
  }

  /* URL param (?theme=light|dark) wins once, then storage, then dark default. */
  const urlTheme = new URLSearchParams(window.location.search).get("theme");
  applyTheme(
    urlTheme === "light" || urlTheme === "dark"
      ? urlTheme
      : storedTheme() === "light"
        ? "light"
        : "dark",
  );

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { theme: next } }));
    });
  });

  /* ---- topbar scroll state ---- */
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const onScroll = () => topbar.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- mobile menu ---- */
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (toggle && menu) {
    const close = () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
    };
    toggle.addEventListener("click", () => {
      const open = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
    });
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  /* ---- scroll reveal ---- */
  const revealed = document.querySelectorAll(".reveal");
  if (revealed.length && "IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealed.forEach((el) => io.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- terminal typing effect ---- */
  const typed = document.querySelector("[data-typed]");
  if (typed) {
    const text = typed.dataset.typedText || typed.dataset.typed || "";
    if (reducedMotion) {
      typed.textContent = text;
    } else {
      typed.textContent = "";
      let i = 0;
      const step = () => {
        typed.textContent = text.slice(0, (i += 1));
        if (i < text.length) setTimeout(step, 55 + Math.random() * 70);
      };
      setTimeout(step, 550);
    }
  }
})();
