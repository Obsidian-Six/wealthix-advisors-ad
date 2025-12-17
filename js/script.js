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
