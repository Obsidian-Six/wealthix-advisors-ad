const GOOGLE_APPS_SCRIPT_URL =
  window.GOOGLE_APPS_SCRIPT_URL ||
  window.googleAppsScriptUrl ||
  "https://script.google.com/macros/s/AKfycbyq4ex8jXo2UECHH10IeLCZ3KZoF6KvGGzmYthbrc58yIkOc3wQLbo8DExvE1EuByT-/exec";

const logFormPayload = (label, payload) => {
  console.log(`[${label}] submission payload`, payload);
};

const trackLeadConversion = () => {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {
    send_to: "AW-17809995237/BXUcCOWG1dYbEOXru6xC",
    value: 1.0,
    currency: "AED",
  });
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
      keepalive: true,
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

const getWhatsAppRedirectUrl = (payload) => {
  const serviceLabels = {
    "basic-package": "Basic Package",
    "standard-package": "Standard Package",
    "premium-package": "Premium Package",
    "tailored-plan": "Tailored Plan",
    "tax": "Tax Advisory",
    "vat": "VAT Services",
    "accounting": "Accounting",
    "compliance": "Compliance",
    "others": "Others"
  };

  let serviceLabel = payload.service || "";
  if (serviceLabels[serviceLabel]) {
    serviceLabel = serviceLabels[serviceLabel];
  } else if (serviceLabel) {
    serviceLabel = serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1);
  }

  let msg = `Hello Wealthix Advisors,\n\n`;
  msg += `I have submitted an enquiry on your website. Here are my details:\n\n`;
  msg += `*Name:* ${payload.name || ""}\n`;
  msg += `*Phone:* +${payload.mobile || payload.phone || ""}\n`;
  msg += `*Email:* ${payload.email || ""}\n`;
  if (serviceLabel) {
    msg += `*Service:* ${serviceLabel}\n`;
  }
  if (payload.message) {
    msg += `*Message:* ${payload.message}\n`;
  }

  return `https://wa.me/971527941604?text=${encodeURIComponent(msg)}`;
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
    // When user clicks the flag or when country changes, hide the search icon
    // inside the country dropdown to simplify the UI for flag selection.
    const itiRoot = input.closest('.iti') || input.parentElement;
    const selectedFlag = itiRoot && itiRoot.querySelector('.iti__selected-flag');
    const hideSearchIcon = () => {
      if (itiRoot) itiRoot.classList.add('hide-search-icon');
      // mark the phone input too so its background/search decoration is removed
      try { input.classList.add('no-search-icon'); } catch (e) {}
      // also clear any background-image on any search inputs in country lists
      document.querySelectorAll('.iti__country-list input[type="search"], .iti__country-list .iti__search, .iti__country-list .iti__searchbox').forEach(el => {
        try { el.style.backgroundImage = 'none'; } catch (e) {}
      });
    };

    selectedFlag?.addEventListener('click', () => {
      // plugin often creates the country list after click; run cleanup shortly after
      hideSearchIcon();
      setTimeout(hideSearchIcon, 120);
    });
    // intl-tel-input dispatches a `countrychange` event on the input when selection changes
    input.addEventListener('countrychange', () => {
      hideSearchIcon();
      setTimeout(hideSearchIcon, 120);
    });
  });
};

document.addEventListener("DOMContentLoaded", initIntlTelInputs);

// Contact quick form validation and submission
const initContactForm = () => {
  const form = document.querySelector('.contact-cta__form');
  if (!form) return;

  const phoneInput = form.querySelector('[data-intl-phone]');
  const emailInput = form.querySelector('input[type="email"]');
  const nameInput = form.querySelector('input[name="contactName"]');
  const messageInput = form.querySelector('textarea[name="contactMessage"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showError = (msg) => {
    let err = form.querySelector('.contact-cta__feedback');
    if (!err) {
      err = document.createElement('div');
      err.className = 'contact-cta__feedback';
      form.appendChild(err);
    }
    err.textContent = msg;
    err.hidden = false;
    err.focus?.();
  };

  const clearError = () => {
    const err = form.querySelector('.contact-cta__feedback');
    if (err) err.hidden = true;
  };

  const isPhoneValid = () => {
    if (!phoneInput) return false;
    const instance = intlTelInstances.get(phoneInput);
    if (instance && typeof instance.isValidNumber === 'function') {
      try {
        return instance.isValidNumber();
      } catch (e) {}
    }
    const digits = (phoneInput.value || '').replace(/\D/g, '');
    return digits.length >= 7;
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearError();

    if (!nameInput || !nameInput.value.trim()) {
      showError('Please enter your name.');
      return;
    }
    if (!emailInput || !emailPattern.test((emailInput.value||'').trim())) {
      showError('Please enter a valid email address.');
      return;
    }
    if (!isPhoneValid()) {
      showError('Please enter a valid phone number.');
      return;
    }
    if (!messageInput || !messageInput.value.trim()) {
      showError('Please enter a message.');
      return;
    }

    // Build payload similar to hero form
    const payload = {
      source: 'Contact_Quick_Enquiry',
      name: (nameInput.value || '').trim(),
      mobile: getInternationalNumber(phoneInput, phoneInput.value || ''),
      email: (emailInput.value || '').trim(),
      message: (messageInput.value || '').trim(),
    };

    try {
      submitBtn?.setAttribute('aria-busy', 'true');
      await sendAppsScriptRequest(payload);
      // show success
      let success = form.querySelector('[data-contact-success]');
      if (!success) {
        success = document.createElement('div');
        success.setAttribute('data-contact-success', '');
        success.className = 'contact-cta__feedback';
        success.textContent = 'Thanks! Your enquiry has been submitted.';
        form.appendChild(success);
      }
      form.reset();
      // open whatsapp for lead as in hero form
      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Contact form submission failed', err);
      showError('Submission failed. Please try again later.');
    } finally {
      submitBtn?.setAttribute('aria-busy', 'false');
    }
  });
};

document.addEventListener('DOMContentLoaded', initContactForm);

// Enforce maxlength attributes on inputs/textareas to prevent unlimited characters
const initMaxlengthEnforcement = () => {
  const els = document.querySelectorAll('input[maxlength], textarea[maxlength]');
  if (!els.length) return;
  const enforce = (el) => {
    const max = parseInt(el.getAttribute('maxlength'), 10);
    if (Number.isNaN(max)) return;
    const handler = (e) => {
      if (el.value && el.value.length > max) {
        el.value = el.value.slice(0, max);
      }
    };
    el.addEventListener('input', handler);
    el.addEventListener('paste', (ev) => {
      // wait for paste to complete then trim
      setTimeout(() => handler(), 0);
    });
  };
  els.forEach(enforce);
};

document.addEventListener('DOMContentLoaded', initMaxlengthEnforcement);

// Enforce max 12 digits for telephone inputs and auto-select country flag when user types a leading +<dialcode>
const initPhoneDigitLimitAndAutoCountry = () => {
  const inputs = document.querySelectorAll('[data-intl-phone]');
  if (!inputs.length) return;

  const countryData =
    (window.intlTelInputGlobals &&
      typeof window.intlTelInputGlobals.getCountryData === 'function' &&
      window.intlTelInputGlobals.getCountryData()) ||
    (window.intlTelInputGlobals && window.intlTelInputGlobals.countryData) ||
    [];

  inputs.forEach((input) => {
    const instance = intlTelInstances.get(input);
    const handler = () => {
      let val = input.value || '';
      const hasPlus = val.trim().startsWith('+');
      const digits = (val.replace(/\D/g, '') || '').slice(0, 12); // limit to 12 digits
      // reconstruct a simple value preserving leading + if present
      input.value = hasPlus ? `+${digits}` : digits;

      // auto-select country when user types dial code starting with +
      if (hasPlus && digits.length >= 1 && instance && countryData.length) {
        // find longest matching dialCode
        let match = null;
        for (const c of countryData) {
          if (!c.dialCode) continue;
          if (digits.startsWith(c.dialCode)) {
            if (!match || c.dialCode.length > match.dialCode.length) match = c;
          }
        }
        if (match && match.iso2 && typeof instance.setCountry === 'function') {
          try {
            instance.setCountry(match.iso2);
          } catch (e) {
            // ignore
          }
        }
      }
    };

    input.addEventListener('input', handler);
    input.addEventListener('paste', () => setTimeout(handler, 0));
  });
};

document.addEventListener('DOMContentLoaded', initPhoneDigitLimitAndAutoCountry);
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
    // validate phone using intl-tel-input if available, otherwise ensure digits length
    const phoneField = phoneInput;
    if (!values.phone) return false;
    const phoneInstance = phoneField && intlTelInstances.get(phoneField);
    if (phoneInstance && typeof phoneInstance.isValidNumber === 'function') {
      try {
        if (!phoneInstance.isValidNumber()) return false;
      } catch (e) {}
    } else {
      const digits = (values.phone || '').toString().replace(/\D/g, '');
      if (digits.length < 7) return false;
    }
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
      sendAppsScriptRequest(payload);
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
      trackLeadConversion();

      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, "_blank");
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
  if (!modal) return;

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
  const AUTO_MODAL_DELAY = 5000;
  let autoPopupTimer = null;
  let autoPopupTriggered = false;

  const clearAutoPopupTimer = () => {
    if (!autoPopupTimer) return;
    clearTimeout(autoPopupTimer);
    autoPopupTimer = null;
  };

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
    autoPopupTriggered = true;
    clearAutoPopupTimer();
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

  const scheduleAutoPopup = () => {
    if (autoPopupTriggered) return;
    clearAutoPopupTimer();
    autoPopupTimer = window.setTimeout(() => {
      autoPopupTimer = null;
      if (autoPopupTriggered || !modal.hidden) return;
      openModal();
    }, AUTO_MODAL_DELAY);
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-modal-trigger]");
    if (!trigger) return;
    event.preventDefault();
    openModal(trigger.getAttribute("data-service"));
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
      sendAppsScriptRequest(payload);
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
      trackLeadConversion();

      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, "_blank");
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

  scheduleAutoPopup();
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
      sendAppsScriptRequest(payload);
    } catch (error) {
      console.error("Contact form submission failed", error);
    } finally {
      contactForm.reset();
      submitting = false;
      updateSubmitState();
      if (successMessage) {
        successMessage.hidden = false;
      }
      trackLeadConversion();

      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, "_blank");
    }
  });

  updateSubmitState();
})();

// Track clicks on the floating WhatsApp consultation button
(() => {
  const waFloatBtn = document.getElementById("whatsapp-float-btn");
  if (waFloatBtn) {
    waFloatBtn.addEventListener("click", () => {
      if (typeof trackLeadConversion === "function") {
        trackLeadConversion();
      }
    });
  }
})();
