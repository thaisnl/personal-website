(function () {
  const twinSection = document.getElementById("twin");
  const iframe = document.getElementById("twin-iframe");
  if (!twinSection || !iframe) return;

  let twinUrl = twinSection.dataset.twinUrl;
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocal) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("backend") !== "remote") {
      twinUrl = "http://127.0.0.1:7860";
    }
  }

  if (!twinUrl) return;

  iframe.src = twinUrl;
  const twinOrigin = new URL(twinUrl, window.location.href).origin;
  let twinReady = false;
  const pendingPrompts = [];

  function getActiveLang() {
    return document.querySelector(".lang-btn.active")?.dataset.lang || "pt";
  }

  function getChipText(chip) {
    const lang = getActiveLang();
    return lang === "pt" ? chip.dataset.ptHtml : chip.dataset.enHtml;
  }

  function setChipsBusy(busy) {
    document.querySelectorAll(".qchip").forEach((chip) => {
      chip.classList.toggle("is-busy", busy);
      chip.setAttribute("aria-disabled", busy ? "true" : "false");
    });
  }

  function postPrompt(text) {
    if (!iframe.contentWindow) return false;
    iframe.contentWindow.postMessage({ type: "twin:prompt", text }, twinOrigin);
    return true;
  }

  function sendPrompt(text) {
    const prompt = text?.trim();
    if (!prompt) return;

    if (!twinReady) {
      pendingPrompts.push(prompt);
      setChipsBusy(true);
      return;
    }

    postPrompt(prompt);
  }

  function flushPendingPrompts() {
    twinReady = true;
    setChipsBusy(false);
    while (pendingPrompts.length) {
      postPrompt(pendingPrompts.shift());
    }
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== twinOrigin) return;
    if (event.data?.type === "twin:ready") {
      flushPendingPrompts();
    }
  });

  iframe.addEventListener("load", () => {
    twinReady = false;
    setChipsBusy(true);
    setTimeout(() => {
      if (!twinReady) {
        flushPendingPrompts();
      }
    }, 2000);
  });

  document.querySelectorAll(".qchip").forEach((chip) => {
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.addEventListener("click", () => {
      sendPrompt(getChipText(chip));
      twinSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    chip.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      sendPrompt(getChipText(chip));
      twinSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
