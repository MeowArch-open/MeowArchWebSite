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
