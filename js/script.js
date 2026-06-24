const GOOGLE_APPS_SCRIPT_URL =
  window.GOOGLE_APPS_SCRIPT_URL ||
  window.googleAppsScriptUrl ||
  "https://script.google.com/macros/s/AKfycbxSiE2OK4NyASeTETqdlaKf1UK9DaanYpTk842Soliusc4zqxFTQLaroFd-EplJAOks/exec";

const logFormPayload = (label, payload) => {
  console.log(`[${label}] submission payload`, payload);
};

// CAPTCHA Management
const captchas = new Map();

const initCaptcha = (form, questionEl, answerEl) => {
  if (!form || !questionEl || !answerEl) return;
  const num1 = Math.floor(Math.random() * 9) + 2; // Random number 2-10
  const num2 = Math.floor(Math.random() * 9) + 2;
  const expected = num1 + num2;
  captchas.set(form, { num1, num2, expected, questionEl, answerEl });
  questionEl.textContent = `${num1} + ${num2}`;
  answerEl.value = "";
};

const validateCaptcha = (form, questionEl, answerEl, showErrorFn) => {
  const data = captchas.get(form);
  if (!data) return true;
  const userVal = parseInt(answerEl.value.trim(), 10);
  if (Number.isNaN(userVal)) {
    showErrorFn("Please solve the security question.");
    return false;
  }
  if (userVal !== data.expected) {
    showErrorFn("Incorrect security answer. Please try again.");
    initCaptcha(form, questionEl, answerEl);
    return false;
  }
  return true;
};

const trackLeadConversion = () => {
  if (typeof window.gtag !== "function") return;
  // Standard lead conversion tracking
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
    throw new Error("Missing Apps Script endpoint");
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
  } catch (error) {
    console.error("Apps Script submission failed", error);
    throw error;
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
      // force-remove or clear any search input/icon nodes if present for inconsistent plugin markup
      const removeCountryListSearch = (rootEl) => {
        try {
          const root = rootEl || document.body;
          const lists = root.querySelectorAll('.iti__country-list');
          lists.forEach(list => {
            // find inputs (search) and aggressively clear placeholder/value and then remove
            const inputs = Array.from(list.querySelectorAll('input[type="search"], input, .iti__search, .iti__searchbox'));
            inputs.forEach(s => {
              try {
                // clear placeholder and value first
                if (s instanceof HTMLInputElement) {
                  s.placeholder = '';
                  s.removeAttribute('placeholder');
                  s.value = '';
                  s.removeAttribute('aria-label');
                  s.setAttribute('aria-hidden', 'true');
                  s.tabIndex = -1;
                  s.style.display = 'none';
                  // attempt removal
                  if (s.parentElement) s.remove();
                } else if (s && s.style) {
                  s.style.display = 'none';
                  s.remove();
                }
              } catch (e) {}
            });

            // remove any svg or icon nodes inside the list that look like magnifiers
            list.querySelectorAll('svg, .icon, [class*="search"], [class*="magnifier"]').forEach(ic => {
              try { ic.style.display = 'none'; ic.remove(); } catch (e) {}
            });
          });
        } catch (e) {
          // ignore
        }
      };
      removeCountryListSearch(itiRoot || document.body);
    };

    selectedFlag?.addEventListener('click', () => {
      // plugin often creates the country list after click; run cleanup shortly after
      hideSearchIcon();
      setTimeout(hideSearchIcon, 120);
      // also attempt a stronger removal after dropdown is added
      setTimeout(() => {
        try {
          const list = document.querySelector('.iti__country-list');
          if (list) {
            // remove search input + icons
            const s = list.querySelector('input[type="search"], .iti__search, .iti__searchbox');
            if (s) { s.style.display = 'none'; s.remove(); }
            list.querySelectorAll('svg, .icon, [class*="search"], [class*="magnifier"]').forEach(ic => { try { ic.style.display = 'none'; ic.remove(); } catch(e){} });
          }
        } catch (e) {}
      }, 220);
    });
    // intl-tel-input dispatches a `countrychange` event on the input when selection changes
    input.addEventListener('countrychange', () => {
      hideSearchIcon();
      setTimeout(hideSearchIcon, 120);
      setTimeout(() => {
        try {
          const list = document.querySelector('.iti__country-list');
          if (list) {
            const s = list.querySelector('input[type="search"], .iti__search, .iti__searchbox');
            if (s) { s.style.display = 'none'; s.remove(); }
            list.querySelectorAll('svg, .icon, [class*="search"], [class*="magnifier"]').forEach(ic => { try { ic.style.display = 'none'; ic.remove(); } catch(e){} });
          }
        } catch (e) {}
      }, 220);
    });

    // MutationObserver: if plugin injects the country list later, remove its search field/icons
    try {
      const mo = new MutationObserver((muts) => {
        muts.forEach(m => {
          m.addedNodes && m.addedNodes.forEach(node => {
            if (!(node instanceof HTMLElement)) return;
            if (node.classList && node.classList.contains('iti__country-list')) {
              // remove search input/icon immediately and again shortly after
              try {
                const s = node.querySelector('input[type="search"], .iti__search, .iti__searchbox');
                if (s) { s.style.display = 'none'; s.remove(); }
                node.querySelectorAll('svg, .icon, [class*="search"], [class*="magnifier"]').forEach(ic => { try { ic.style.display = 'none'; ic.remove(); } catch(e){} });
              } catch (e) {}
              setTimeout(() => {
                try {
                  const s2 = node.querySelector('input[type="search"], .iti__search, .iti__searchbox');
                  if (s2) { s2.style.display = 'none'; s2.remove(); }
                } catch (e) {}
              }, 180);
            }
          });
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
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
  const successMessage = form.querySelector('[data-contact-success]');
  const defaultSubmitLabel = submitBtn?.textContent?.trim() ?? "Submit Now";

  const captchaQuestion = form.querySelector('#contact-captcha-question');
  const captchaAnswer = form.querySelector('#contact-captcha-answer');
  initCaptcha(form, captchaQuestion, captchaAnswer);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showError = (msg) => {
    let err = form.querySelector('.contact-cta__feedback:not([data-contact-success])');
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
    const err = form.querySelector('.contact-cta__feedback:not([data-contact-success])');
    if (err) err.hidden = true;
  };

  const getPhoneErrorMessage = () => {
    if (!phoneInput) return 'Please enter your phone number.';
    const instance = intlTelInstances.get(phoneInput);
    const digits = (phoneInput.value || '').replace(/\D/g, '');
    if (!digits.length) return 'Please enter your phone number.';
    if (instance && typeof instance.isValidNumber === 'function') {
      try {
        if (instance.isValidNumber() || instance.isPossibleNumber()) return null;
        // Get selected country name for a helpful message
        const countryData = instance.getSelectedCountryData && instance.getSelectedCountryData();
        const countryName = countryData && countryData.name ? countryData.name : 'the selected country';
        return `Please enter a valid phone number for ${countryName}. You entered ${digits.length} digit(s).`;
      } catch (e) {}
    }
    if (digits.length < 7) return `Please enter a valid phone number (minimum 7 digits). You entered ${digits.length} digit(s).`;
    return null;
  };

  form.addEventListener('input', () => {
    clearError();
    if (successMessage) {
      successMessage.hidden = true;
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearError();
    if (successMessage) {
      successMessage.hidden = true;
    }

    if (!nameInput || !nameInput.value.trim()) {
      showError('Please enter your name.');
      return;
    }
    const phoneError = getPhoneErrorMessage();
    if (phoneError) {
      showError(phoneError);
      return;
    }
    if (!emailInput || !emailPattern.test((emailInput.value||'').trim())) {
      showError('Please enter a valid email address.');
      return;
    }
    if (!messageInput || !messageInput.value.trim()) {
      showError('Please enter a message.');
      return;
    }

    if (!validateCaptcha(form, captchaQuestion, captchaAnswer, showError)) {
      return;
    }

    const phoneVal = getInternationalNumber(phoneInput, phoneInput.value || '');
    const captchaData = captchas.get(form) || {};
    const payload = {
      source: 'Contact_Quick_Enquiry',
      name: (nameInput.value || '').trim(),
      mobile: phoneVal,
      phone: phoneVal,
      email: (emailInput.value || '').trim(),
      message: (messageInput.value || '').trim(),
      captchaQuestion: captchaData.num1 ? `${captchaData.num1} + ${captchaData.num2}` : "",
      captchaAnswer: (captchaAnswer.value || '').trim(),
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'progress';
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Submitting...';
      }

      await sendAppsScriptRequest(payload);
      
      form.reset();
      initCaptcha(form, captchaQuestion, captchaAnswer);
      if (successMessage) {
        successMessage.hidden = false;
      }
      trackLeadConversion();
      
      // open whatsapp for lead as in hero form
      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, '_blank');

      // redirect to thank you page
      setTimeout(() => {
        window.location.href = "thank-you.html";
      }, 500);
    } catch (err) {
      console.error('Contact form submission failed', err);
      showError('Submission failed. Please try again later.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.cursor = '';
        submitBtn.setAttribute('aria-busy', 'false');
        submitBtn.textContent = defaultSubmitLabel;
      }
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

  const captchaQuestion = form.querySelector('#hero-captcha-question');
  const captchaAnswer = form.querySelector('#hero-captcha-answer');
  initCaptcha(form, captchaQuestion, captchaAnswer);

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

  const getFieldError = (values = getValues()) => {
    if (!values.fullName) return 'Please enter your name.';
    // validate phone using intl-tel-input if available, otherwise ensure digits length
    const phoneField = phoneInput;
    if (!values.phone) return 'Please enter your phone number.';
    const digits = (values.phone || '').toString().replace(/\D/g, '');
    const phoneInstance = phoneField && intlTelInstances.get(phoneField);
    if (phoneInstance && typeof phoneInstance.isValidNumber === 'function') {
      try {
        if (!phoneInstance.isValidNumber() && !phoneInstance.isPossibleNumber()) {
          const countryData = phoneInstance.getSelectedCountryData && phoneInstance.getSelectedCountryData();
          const countryName = countryData && countryData.name ? countryData.name : 'the selected country';
          return `Please enter a valid phone number for ${countryName}. You entered ${digits.length} digit(s).`;
        }
      } catch (e) {
        if (digits.length < 7) return `Please enter a valid phone number (minimum 7 digits). You entered ${digits.length} digit(s).`;
      }
    } else {
      if (digits.length < 7) return `Please enter a valid phone number (minimum 7 digits). You entered ${digits.length} digit(s).`;
    }
    if (!emailPattern.test(values.email)) return 'Please enter a valid email address.';
    if (!values.service) return 'Please select a service.';
    if (!values.message) return 'Please enter your message.';
    return null;
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
    const fieldError = getFieldError(values);
    if (fieldError) {
      setError(fieldError);
      updateButton();
      return;
    }

    if (!validateCaptcha(form, captchaQuestion, captchaAnswer, setError)) {
      updateButton();
      return;
    }

    const phoneVal = getInternationalNumber(phoneInput, values.phone);
    const captchaData = captchas.get(form) || {};
    const payload = {
      source: "Landing_Page_Enquiry",
      name: values.fullName,
      mobile: phoneVal,
      phone: phoneVal,
      email: values.email,
      service: values.service,
      message: values.message,
      captchaQuestion: captchaData.num1 ? `${captchaData.num1} + ${captchaData.num2}` : "",
      captchaAnswer: (captchaAnswer.value || '').trim(),
    };
    logFormPayload(payload.source, payload);

    submitting = true;
    setError("");
    updateButton();

    try {
      await sendAppsScriptRequest(payload);
      form.reset();
      initCaptcha(form, captchaQuestion, captchaAnswer);
      form.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.focus();
      }
      trackLeadConversion();

      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, "_blank");

      // redirect to thank you page
      setTimeout(() => {
        window.location.href = "thank-you.html";
      }, 500);
    } catch (err) {
      console.error("Hero form submission failed", err);
      setError("Submission failed. Please try again later.");
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

  const modalCaptchaQuestion = modalForm?.querySelector('#modal-captcha-question');
  const modalCaptchaAnswer = modalForm?.querySelector('#modal-captcha-answer');
  if (modalForm && modalCaptchaQuestion && modalCaptchaAnswer) {
    initCaptcha(modalForm, modalCaptchaQuestion, modalCaptchaAnswer);
  }

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
    if (modalCaptchaQuestion && modalCaptchaAnswer) {
      initCaptcha(modalForm, modalCaptchaQuestion, modalCaptchaAnswer);
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

    // Field-specific validation for modal
    const formData = new FormData(modalForm);
    const nameVal = formData.get("fullName")?.toString().trim() || "";
    const emailVal = formData.get("email")?.toString().trim() || "";
    const serviceVal = formData.get("service")?.toString().trim() || "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Find or create an error element for the modal form
    let modalErrorEl = modalForm.querySelector("[data-modal-error]");
    if (!modalErrorEl) {
      modalErrorEl = document.createElement("p");
      modalErrorEl.className = "form-message form-message--error";
      modalErrorEl.setAttribute("data-modal-error", "");
      modalErrorEl.setAttribute("role", "alert");
      modalErrorEl.style.marginTop = "0.5rem";
      modalForm.appendChild(modalErrorEl);
    }
    const setModalError = (msg) => {
      modalErrorEl.textContent = msg;
      modalErrorEl.hidden = !msg;
    };

    // Clear previous errors on input
    const clearOnInput = () => setModalError("");
    modalForm.removeEventListener("input", clearOnInput);
    modalForm.addEventListener("input", clearOnInput);

    if (!nameVal) {
      setModalError("Please enter your name.");
      return;
    }

    // Phone validation
    const phoneRaw = formData.get("phone")?.toString().trim() || "";
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    if (!phoneDigits.length) {
      setModalError("Please enter your phone number.");
      return;
    }
    const modalPhoneInstance = modalPhoneInput && intlTelInstances.get(modalPhoneInput);
    if (modalPhoneInstance && typeof modalPhoneInstance.isValidNumber === "function") {
      try {
        if (!modalPhoneInstance.isValidNumber() && !modalPhoneInstance.isPossibleNumber()) {
          const cd = modalPhoneInstance.getSelectedCountryData && modalPhoneInstance.getSelectedCountryData();
          const cn = cd && cd.name ? cd.name : "the selected country";
          setModalError(`Please enter a valid phone number for ${cn}. You entered ${phoneDigits.length} digit(s).`);
          return;
        }
      } catch (e) {
        if (phoneDigits.length < 7) {
          setModalError(`Please enter a valid phone number (minimum 7 digits). You entered ${phoneDigits.length} digit(s).`);
          return;
        }
      }
    } else {
      if (phoneDigits.length < 7) {
        setModalError(`Please enter a valid phone number (minimum 7 digits). You entered ${phoneDigits.length} digit(s).`);
        return;
      }
    }

    if (!emailPattern.test(emailVal)) {
      setModalError("Please enter a valid email address.");
      return;
    }
    if (!serviceVal) {
      setModalError("Please select a service.");
      return;
    }

    if (modalForm && modalCaptchaQuestion && modalCaptchaAnswer) {
      if (!validateCaptcha(modalForm, modalCaptchaQuestion, modalCaptchaAnswer, setModalError)) {
        return;
      }
    }

    setModalError("");

    const phoneVal = getInternationalNumber(
      modalPhoneInput,
      formData.get("phone")?.toString().trim() || ""
    );
    const captchaData = modalForm ? captchas.get(modalForm) : null;
    const payload = {
      source: "Landing_Page_Package_Enquiry",
      name: nameVal,
      mobile: phoneVal,
      phone: phoneVal,
      email: emailVal,
      service: serviceVal,
      captchaQuestion: captchaData && captchaData.num1 ? `${captchaData.num1} + ${captchaData.num2}` : "",
      captchaAnswer: modalCaptchaAnswer ? (modalCaptchaAnswer.value || '').trim() : "",
    };
    logFormPayload(payload.source, payload);

    setModalSubmitting(true);

    try {
      await sendAppsScriptRequest(payload);
      modalForm.reset();
      if (modalCaptchaQuestion && modalCaptchaAnswer) {
        initCaptcha(modalForm, modalCaptchaQuestion, modalCaptchaAnswer);
      }
      if (modalSuccess) {
        modalForm.hidden = true;
        modalSuccess.hidden = false;
        modalSuccess.focus();
      }
      trackLeadConversion();

      const whatsappUrl = getWhatsAppRedirectUrl(payload);
      window.open(whatsappUrl, "_blank");

      // redirect to thank you page
      setTimeout(() => {
        window.location.href = "thank-you.html";
      }, 500);
    } catch (error) {
      console.error("Modal form submission failed", error);
      setModalError("Submission failed. Please try again later.");
    } finally {
      setModalSubmitting(false);
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


