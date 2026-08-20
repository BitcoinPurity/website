(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard
        .writeText(text)
        .then(function () {
          return true;
        })
        .catch(fallback);
    }
    return Promise.resolve(fallback());

    function fallback() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  function showCopied(button) {
    if (button.dataset.copyBusy === "1") return;
    button.dataset.copyBusy = "1";
    var original = button.textContent;
    var label = button.getAttribute("aria-label") || "";
    button.textContent = "Copied";
    if (label.indexOf("Copy ") === 0) {
      button.setAttribute("aria-label", label.slice(5) + " copied");
    }
    window.setTimeout(function () {
      button.textContent = original;
      button.dataset.copyBusy = "0";
      if (label) button.setAttribute("aria-label", label);
    }, 1600);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    var text = button.getAttribute("data-copy");
    if (!text) return;
    copyText(text).then(function (ok) {
      if (ok) showCopied(button);
    });
  });
})();
