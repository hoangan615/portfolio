const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealNodes = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("visible"));
}

const yearTarget = document.querySelector("[data-year]");
if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

const contactForm = document.querySelector("[data-contact-form]");
if (contactForm) {
  const mailtoFallback = contactForm.querySelector("[data-mailto-fallback]");
  const mailtoLink = contactForm.querySelector("[data-mailto-link]");

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const rawSubject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = rawSubject || `Portfolio inquiry from ${name || "a visitor"}`;

    const lines = [
      `Hello Anh An,`,
      "",
      `I am reaching out via your portfolio site.`,
      "",
      `Subject: ${subject}`,
      "",
      `Message:`,
      message || "(No message provided)",
      "",
      `Sender name: ${name || "Anonymous"}`,
      `Sender email: ${email || "Not provided"}`,
    ];

    const href =
      "mailto:hoangan615@gmail.com" +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`;

    if (mailtoLink) {
      mailtoLink.setAttribute("href", href);
    }

    if (mailtoFallback) {
      mailtoFallback.hidden = false;
    }

    const tempLink = document.createElement("a");
    tempLink.href = href;
    tempLink.style.display = "none";
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    window.setTimeout(() => {
      window.location.assign(href);
    }, 120);
  });
}

const printButton = document.querySelector("[data-print-cv]");
if (printButton) {
  printButton.addEventListener("click", () => window.print());
}

const params = new URLSearchParams(window.location.search);
if (params.get("print") === "1") {
  window.setTimeout(() => window.print(), 500);
}
