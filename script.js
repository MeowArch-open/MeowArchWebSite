/* Mark JS availability (drives the .reveal entrance animations). */
document.documentElement.classList.add("js-reveal");

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const themeToggle = document.querySelector(".theme-toggle");
const topbar = document.querySelector(".topbar");

const updateTopbarState = () => {
  if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 24);
};

updateTopbarState();
window.addEventListener("scroll", updateTopbarState, { passive: true });

const navigationLinks = [
  ...document.querySelectorAll(".nav-link, .mobile-nav-link"),
];

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const destination = link.getAttribute("href");
    navigationLinks.forEach((item) => {
      const active = item.getAttribute("href") === destination;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  });
});

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    mobileMenu.toggleAttribute("inert", !isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileMenu.setAttribute("inert", "");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      mobileMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileMenu.setAttribute("inert", "");
      menuToggle.focus();
    }
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nightMode = document.body.classList.toggle("night-mode");
    themeToggle.setAttribute("aria-pressed", String(nightMode));
    themeToggle.setAttribute(
      "aria-label",
      nightMode ? "Switch to light theme" : "Switch theme",
    );
  });
}

const flavorSelect = document.querySelector(".flavor-select");

if (flavorSelect) {
  const API = window.MEOWARCH_API_BASE || "http://127.0.0.1:3000/api/v1";
  const REQUEST_TIMEOUT_MS = 5000;

  const desktopFallback = {
    isoTitle: "MeowArch ISO",
    isoDesc: "v1.0.0 · x86_64 · ~1 GB",
    isoName: "meowarch-1.0.0-x86_64.iso",
  };

  const setFlavorContent = (flavor) => {
    document
      .querySelectorAll('[data-flavor="iso-title"]')
      .forEach((el) => (el.textContent = flavor.isoTitle));
    document
      .querySelectorAll('[data-flavor="iso-desc"]')
      .forEach((el) => (el.textContent = flavor.isoDesc));
    document
      .querySelectorAll('[data-flavor="checksum-cmd"]')
      .forEach((el) => (el.textContent = `$ sha256sum ${flavor.isoName}`));
    document
      .querySelectorAll('[data-flavor="checksum-hash"]')
      .forEach(
        (el) =>
          (el.textContent = `0000000000000000000000000000000000000000000000000000000000000000  ${flavor.isoName}`),
      );
  };

  /* Desktop flavor: fill from the API when available, else keep fallback. */
  const applyDesktop = async () => {
    setFlavorContent(desktopFallback);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(`${API}/releases/latest?flavor=meowarch`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return; // 404 / error -> keep the fallback content
      const body = await res.json();
      const release = body.data;
      const iso = release?.artifacts?.iso;
      if (!release || !iso) return;

      setFlavorContent({
        isoTitle: "MeowArch ISO",
        isoDesc: `${release.version} · x86_64 · ${iso.fileSize || "—"}`,
        isoName: iso.fileName,
      });

      const versionEl = document.querySelector(".release-version");
      if (versionEl && release.version) {
        versionEl.textContent = release.version;
      }
      const dateEl = document.querySelector(".release-date");
      if (dateEl && release.releaseDate) {
        dateEl.textContent = release.releaseDate;
      }
    } catch {
      // API offline -> keep the fallback content
    }
  };

  flavorSelect.addEventListener("change", () => {
    if (flavorSelect.value === "mobile") {
      window.location.href = "devices.html";
      return;
    }
    applyDesktop();
  });

  applyDesktop();
}

/* Scroll-triggered reveal. Elements keep their hidden state only while JS
   is available; without observer support we simply show everything. */
const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length > 0) {
  if ("IntersectionObserver" in window) {
    const revealObserver = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }
}
