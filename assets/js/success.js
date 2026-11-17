/* Success page: wires download buttons to the verified-download endpoint, or shows the error state. */
(() => {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");
  const error = params.get("error");
  const messages = {
    invalid: "This download link is invalid. Use the link from your original purchase page.",
    unpaid: "We couldn't find a completed payment for this link.",
    expired: "This download link has expired (links last 14 days). Email drsv0913@gmail.com with your receipt and we'll resend it.",
    unavailable: "The download is temporarily unavailable. Please try again in a few minutes.",
  };
  if (error || !sessionId) {
    document.querySelector('[data-state="ok"]').hidden = true;
    document.querySelector('[data-state="error"]').hidden = false;
    document.querySelector("[data-error-msg]").textContent = messages[error] || messages.invalid;
    return;
  }
  const base = "/api/download?session_id=" + encodeURIComponent(sessionId);
  document.querySelector("[data-download]").href = base;
  document.querySelector("[data-download-bonus]").href = base + "&file=bonus";

  const link = location.href;
  const msg = document.querySelector("[data-copy-msg]");
  document.querySelector("[data-email-link]").href =
    "mailto:?subject=" + encodeURIComponent("My Blackout Kit download link") +
    "&body=" + encodeURIComponent("Download the Playbook and Buy List here (works for 14 days):\n" + link);
  document.querySelector("[data-copy-link]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(link); msg.textContent = "Link copied. Paste it somewhere safe."; }
    catch { window.prompt("Copy your download link:", link); }
  });
})();
