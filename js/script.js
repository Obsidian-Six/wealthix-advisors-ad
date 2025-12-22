const GOOGLE_APPS_SCRIPT_URL =
  window.GOOGLE_APPS_SCRIPT_URL ||
  window.googleAppsScriptUrl ||
  "https://script.google.com/macros/s/AKfycbyq4ex8jXo2UECHH10IeLCZ3KZoF6KvGGzmYthbrc58yIkOc3wQLbo8DExvE1EuByT-/exec";

const logFormPayload = (label, payload) => {
  console.log(`[${label}] submission payload`, payload);
};

const sendAppsScriptRequest = async (payload) => {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn(
      "GOOGLE_APPS_SCRIPT_URL is not defined. Payload will not be sent.",
      payload
    );
    return { ok: false, error: new Error("Missing endpoint") };
  }

  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (error) {
    console.error("Apps Script submission failed", error);
    return { ok: false, error };
  }
};

const sanitizePhoneNumber = (value = "") =>
  value.toString().replace(/\s+/g, "").replace(/^\+/, "");

const intlTelInstances = new Map();

const getInternationalNumber = (input, fallback = "") => {
  const defaultValue = sanitizePhoneNumber(fallback);
  if (!(input instanceof HTMLInputElement)) {
    return defaultValue;
  }

  const instance = intlTelInstances.get(input);
  if (!instance || typeof instance.getNumber !== "function") {
    return sanitizePhoneNumber(input.value || defaultValue);
  }

  const utils = window.intlTelInputUtils;
  const formatted = utils
    ? instance.getNumber(utils.numberFormat.E164)
    : instance.getNumber();
  return sanitizePhoneNumber(formatted || defaultValue);
};

const initIntlTelInputs = () => {
  const { intlTelInput } = window;
  if (typeof intlTelInput !== "function") return;
  const inputs = document.querySelectorAll("[data-intl-phone]");
  if (!inputs.length) return;

  inputs.forEach((input) => {
    if (input.dataset.intlInitialized === "true") return;
    const instance = intlTelInput(input, {
      initialCountry: "ae",
      loadUtils: () =>
        import(
          "https://cdn.jsdelivr.net/npm/intl-tel-input@25.14.0/build/js/utils.js"
        ),
    });
    intlTelInstances.set(input, instance);
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
  const phoneInput = form.querySelector("[name='phone']");
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

  const isFormValid = (values = getValues()) => {
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
    submitBtn.setAttribute("aria-busy", submitting ? "true" : "false");
    if (labelEl) {
      labelEl.textContent = submitting ? "Submitting..." : defaultLabel;
    }
    if (iconEl) {
      iconEl.hidden = submitting;
    }
    submitBtn.style.cursor = submitting ? "progress" : "";
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
    const values = getValues();
    if (!isFormValid(values)) {
      setError("Please complete all required fields with valid details.");
      updateButton();
      return;
    }

    const payload = {
      source: "Landing_Page_Enquiry",
      name: values.fullName,
      mobile: getInternationalNumber(phoneInput, values.phone),
      email: values.email,
      service: values.service,
      message: values.message,
    };
    logFormPayload(payload.source, payload);

    submitting = true;
    setError("");
    updateButton();

    try {
      await sendAppsScriptRequest(payload);
    } catch (err) {
      console.error("Hero form submission failed", err);
    } finally {
      submitting = false;
      updateButton();
      form.reset();
      form.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.focus();
      }
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
  const modalForm = document.getElementById("modal-enquiry-form");
  const modalSubmitBtn = modalForm?.querySelector("[data-modal-submit]");
  const modalSubmitLabel = modalSubmitBtn?.querySelector(
    "[data-modal-submit-label]"
  );
  const modalSubmitIcon = modalSubmitBtn?.querySelector(
    "[data-modal-submit-icon]"
  );
  const modalSubmitDefaultLabel =
    modalSubmitLabel?.textContent?.trim() || "Book My Consultation";
  const modalPhoneInput = modalForm?.querySelector("[name='phone']");
  const modalSuccess = modal.querySelector("[data-modal-success]");
  const focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocusedElement = null;

  const setModalSubmitting = (state) => {
    if (!modalSubmitBtn) return;
    modalSubmitBtn.disabled = state;
    modalSubmitBtn.style.cursor = state ? "progress" : "";
    modalSubmitBtn.setAttribute("aria-busy", state ? "true" : "false");
    if (modalSubmitLabel) {
      modalSubmitLabel.textContent = state
        ? "Submitting..."
        : modalSubmitDefaultLabel;
    }
    if (modalSubmitIcon) {
      modalSubmitIcon.hidden = state;
    }
  };

  setModalSubmitting(false);

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
    if (modalForm) {
      modalForm.hidden = false;
      modalForm.reset();
    }
    if (modalSuccess) {
      modalSuccess.hidden = true;
    }
    setModalSubmitting(false);
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
    if (modalForm) {
      modalForm.hidden = false;
    }
    if (modalSuccess) {
      modalSuccess.hidden = true;
    }
    setModalSubmitting(false);
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

  modalForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!modalForm.checkValidity()) {
      modalForm.reportValidity();
      return;
    }

    const formData = new FormData(modalForm);
    const payload = {
      source: "Landing_Page_Package_Enquiry",
      name: formData.get("fullName")?.toString().trim() || "",
      phone: getInternationalNumber(
        modalPhoneInput,
        formData.get("phone")?.toString().trim() || ""
      ),
      email: formData.get("email")?.toString().trim() || "",
      service: formData.get("service")?.toString().trim() || "",
    };
    logFormPayload(payload.source, payload);

    setModalSubmitting(true);

    try {
      await sendAppsScriptRequest(payload);
    } catch (error) {
      console.error("Modal form submission failed", error);
    } finally {
      modalForm.reset();
      setModalSubmitting(false);
      if (modalSuccess) {
        modalForm.hidden = true;
        modalSuccess.hidden = false;
        modalSuccess.focus();
      }
    }
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

// Contact CTA form: posts payload to Apps Script and toggles success message
(() => {
  const contactForm = document.querySelector(".contact-cta__form");
  if (!contactForm) return;
  const submitBtn = contactForm.querySelector("button[type='submit']");
  const successMessage = contactForm.querySelector("[data-contact-success]");
  const contactPhoneInput = contactForm.querySelector("[name='contactPhone']");
  const defaultSubmitLabel = submitBtn?.textContent?.trim() ?? "Submit Now";
  let submitting = false;

  const updateSubmitState = () => {
    if (!submitBtn) return;
    submitBtn.disabled = submitting;
    submitBtn.style.cursor = submitting ? "progress" : "";
    submitBtn.setAttribute("aria-busy", submitting ? "true" : "false");
    submitBtn.textContent = submitting ? "Submitting..." : defaultSubmitLabel;
  };

  contactForm.addEventListener("input", () => {
    if (successMessage) {
      successMessage.hidden = true;
    }
    submitting = false;
    updateSubmitState();
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const payload = {
      source: "Landing_Page_Contact",
      name: formData.get("contactName")?.toString().trim() || "",
      phone: getInternationalNumber(
        contactPhoneInput,
        formData.get("contactPhone")?.toString().trim() || ""
      ),
      email: formData.get("contactEmail")?.toString().trim() || "",
      message: formData.get("contactMessage")?.toString().trim() || "",
    };
    logFormPayload(payload.source, payload);

    submitting = true;
    updateSubmitState();

    try {
      await sendAppsScriptRequest(payload);
    } catch (error) {
      console.error("Contact form submission failed", error);
    } finally {
      contactForm.reset();
      submitting = false;
      updateSubmitState();
      if (successMessage) {
        successMessage.hidden = false;
      }
    }
  });

  updateSubmitState();
})();
