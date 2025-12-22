// Hero enquiry form: validates fields, mocks submission, and handles UI feedback
const alertFormValues = (form) => {
  if (!form) return;
  const formData = new FormData(form);
  const lines = [];
  formData.forEach((value, key) => {
    lines.push(`${key}: ${value}`);
  });
  const message = lines.length
    ? `Form values:\n${lines.join("\n")}`
    : "Form submitted with no fields.";
  alert(message);
};

const initIntlTelInputs = () => {
  const { intlTelInput } = window;
  if (typeof intlTelInput !== "function") return;
  const inputs = document.querySelectorAll("[data-intl-phone]");
  if (!inputs.length) return;

  inputs.forEach((input) => {
    if (input.dataset.intlInitialized === "true") return;
    intlTelInput(input, {
      initialCountry: "ae",
      loadUtils: () =>
        import(
          "https://cdn.jsdelivr.net/npm/intl-tel-input@25.14.0/build/js/utils.js"
        ),
    });
    input.dataset.intlInitialized = "true";
  });
};

document.addEventListener("DOMContentLoaded", initIntlTelInputs);

// Hero enquiry form: validates fields, mocks submission, and handles UI feedback
(() => {
  const form = document.getElementById("hero-enquiry-form");
  if (!form) return;

  const submitBtn = form.querySelector("[data-submit-button]");
  const labelEl = submitBtn?.querySelector("[data-button-label]");
  const iconEl = submitBtn?.querySelector(".btn-icon");
  const errorEl = form.querySelector("[data-form-error]");
  const successEl = form.parentElement?.querySelector("[data-form-success]");
  const defaultLabel = labelEl?.textContent ?? "Submit Your Enquiry";
  let submitting = false;

  const requiredFields = ["fullName", "phone", "email", "service", "message"];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getValues = () => {
    const formData = new FormData(form);
    return requiredFields.reduce((acc, key) => {
      const value = formData.get(key);
      acc[key] = value ? value.toString().trim() : "";
      return acc;
    }, {});
  };

  const isFormValid = () => {
    const values = getValues();
    if (!values.fullName) return false;
    if (!values.phone) return false;
    if (!emailPattern.test(values.email)) return false;
    if (!values.service) return false;
    if (!values.message) return false;
    return true;
  };

  const setError = (message = "") => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
  };

  const updateButton = () => {
    if (!submitBtn) return;
    submitBtn.disabled = submitting || !isFormValid();
    submitBtn.setAttribute("aria-busy", submitting ? "true" : "false");
    if (labelEl) {
      labelEl.textContent = submitting ? "Submitting..." : defaultLabel;
    }
    if (iconEl) {
      iconEl.hidden = submitting;
    }
  };

  const mockSubmit = (payload) => {
    // Replace with submitEnquiry helper when backend wiring is available.
    return new Promise((resolve) => {
      setTimeout(() => resolve(payload), 1200);
    });
  };

  form.addEventListener("input", () => {
    setError("");
    updateButton();
  });

  form.addEventListener("change", () => {
    setError("");
    updateButton();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isFormValid()) {
      setError("Please complete all required fields with valid details.");
      updateButton();
      return;
    }

    alertFormValues(form);

    submitting = true;
    setError("");
    updateButton();

    try {
      await mockSubmit(getValues());
      form.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.focus();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.";
      setError(message);
    } finally {
      submitting = false;
      updateButton();
    }
  });

  updateButton();
})();

// FAQ accordion: toggles each card for keyboard + pointer users
(() => {
  const faqCards = document.querySelectorAll(".faq-card");
  if (!faqCards.length) return;

  const toggleCard = (card) => {
    const isOpen = card.getAttribute("data-opened") === "true";
    const nextState = (!isOpen).toString();
    card.setAttribute("data-opened", nextState);
    card.setAttribute("aria-expanded", nextState);
  };

  faqCards.forEach((card) => {
    card.addEventListener("click", () => toggleCard(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        toggleCard(card);
      }
    });
  });
})();

// Packages toggle: swaps between bundled cards and customize CTA
(() => {
  const toggle = document.querySelector("[data-packages-toggle]");
  const container = document.querySelector(".packages-container");
  if (!toggle || !container) return;

  const packageCards = container.querySelectorAll(".packages-card");
  const customizeCard = container.querySelector(".customize-card");

  const setView = (view) => {
    const nextView = view === "customize" ? "customize" : "packages";
    toggle.setAttribute("data-active", nextView);
    container.setAttribute("data-view", nextView);
    toggle.querySelectorAll("[data-view]").forEach((button) => {
      const isActive = button.dataset.view === nextView;
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    packageCards.forEach((card) => {
      card.hidden = nextView !== "packages";
    });

    if (customizeCard) {
      customizeCard.hidden = nextView !== "customize";
    }
  };

  toggle.addEventListener("click", (event) => {
    const target = event.target.closest("[data-view]");
    if (!target) return;
    setView(target.dataset.view ?? "packages");
  });

  setView("packages");
})();

// Global enquiry modal: opens from multiple triggers and traps focus
(() => {
  const modal = document.querySelector("[data-modal]");
  const triggers = document.querySelectorAll("[data-modal-trigger]");
  if (!modal || !triggers.length) return;

  const serviceSelect = modal.querySelector("[data-modal-service]");
  const closeButtons = modal.querySelectorAll("[data-modal-close]");
  const overlay = modal.querySelector("[data-modal-overlay]");
  const firstField = modal.querySelector("#modal-full-name");
  const focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocusedElement = null;

  const isVisible = (element) =>
    element instanceof HTMLElement &&
    !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    );

  const getFocusableElements = () =>
    Array.from(modal.querySelectorAll(focusableSelector)).filter(
      (el) =>
        el instanceof HTMLElement &&
        !el.hasAttribute("disabled") &&
        el.tabIndex !== -1 &&
        !el.hasAttribute("hidden") &&
        isVisible(el)
    );

  const setServiceValue = (value) => {
    if (!serviceSelect) return;
    const hasValue = Array.from(serviceSelect.options).some(
      (option) => option.value === value
    );
    serviceSelect.value = hasValue ? value : "";
  };

  const openModal = (serviceValue) => {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setServiceValue(serviceValue ?? "");
    requestAnimationFrame(() => {
      firstField?.focus();
    });
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (serviceSelect) {
      serviceSelect.value = "";
    }
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(trigger.getAttribute("data-service"));
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  if (overlay) {
    overlay.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const modalForm = document.getElementById("modal-enquiry-form");
  modalForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    alertFormValues(modalForm);
    closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      const focusable = getFocusableElements();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();

// Testimonials carousel: scrolls slides programmatically with nav controls
(() => {
  const carousel = document.getElementById("testimonial-carousel");
  if (!carousel) return;

  const slide = carousel.querySelector(".testimonial-slide");
  if (!slide) return;

  const styles = window.getComputedStyle(carousel);
  const gapValue = styles.gap || styles.columnGap || "0";
  const gap = gapValue.includes("px") ? parseFloat(gapValue) : 0;

  const getScrollAmount = () => slide.getBoundingClientRect().width + gap;

  const scrollByDirection = (dir) => {
    carousel.scrollBy({
      left: dir === "left" ? -getScrollAmount() : getScrollAmount(),
      behavior: "smooth",
    });
  };

  const controls = document.querySelectorAll("[data-testimonial-dir]");
  controls.forEach((control) => {
    control.addEventListener("click", () => {
      const dir = control.getAttribute("data-testimonial-dir");
      if (dir === "left" || dir === "right") {
        scrollByDirection(dir);
      }
    });
  });
})();

// Contact CTA form: basic alert preview before backend wiring
(() => {
  const contactForm = document.querySelector(".contact-cta__form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    alertFormValues(contactForm);
  });
})();
