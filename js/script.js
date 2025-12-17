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

  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "mobile",
    "companyName",
    "service",
  ];

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
    if (!values.firstName || !values.lastName) return false;
    if (!emailPattern.test(values.email)) return false;
    if (!values.mobile) return false;
    if (!values.companyName) return false;
    if (!values.service) return false;
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
