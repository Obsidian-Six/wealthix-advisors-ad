(() => {
  const animatedElements = () =>
    Array.from(document.querySelectorAll(".animate-on-scroll"));

  const applyObserver = () => {
    const elements = animatedElements();
    if (!elements.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          const delay = target.getAttribute("data-animate-delay");
          if (delay) {
            target.style.setProperty("--animation-delay", delay);
          }
          target.classList.add("is-visible");
          obs.unobserve(target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyObserver);
  } else {
    applyObserver();
  }
})();
