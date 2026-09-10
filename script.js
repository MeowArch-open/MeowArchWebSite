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

const THEME_STORAGE_KEY = "meowarch_theme";

const applyTheme = (theme, announce = false) => {
  const nightMode = theme === "night";
  document.body.classList.toggle("night-mode", nightMode);
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(nightMode));
    themeToggle.setAttribute(
      "aria-label",
      nightMode ? "Switch to light theme" : "Switch theme",
    );
  }
  if (announce) {
    window.dispatchEvent(
      new CustomEvent("meowarch:themechange", { detail: { theme } }),
    );
  }
};

let storedTheme = "light";
try {
  storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
} catch {
  // Storage can be unavailable in restricted browsing contexts.
}
applyTheme(storedTheme === "night" ? "night" : "light");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const theme = document.body.classList.contains("night-mode")
      ? "light"
      : "night";
    applyTheme(theme, true);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the in-memory theme when storage is unavailable.
    }
  });
}

const flavorSelect = document.querySelector(".flavor-select");

if (flavorSelect && flavorSelect.id === "flavor-select") {
  const availabilityNote = document.querySelector("#flavor-availability");
  const noAvailableMessage = () => {
    if (availabilityNote && window.MEOWARCH_I18N) {
      availabilityNote.textContent = window.MEOWARCH_I18N.t("d.no_available");
    }
    flavorSelect.value = "mobile";
  };

  flavorSelect.addEventListener("change", () => {
    if (flavorSelect.value === "desktop") {
      noAvailableMessage();
      return;
    }
    if (flavorSelect.value === "mobile") {
      window.location.href = "devices.html";
    }
  });
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
