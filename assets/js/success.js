/* Success page: wires download buttons to the verified-download endpoint, or shows the error state. */
(() => {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");
  const error = params.get("error");
  const messages = {
    invalid: "This download link is invalid. Use the link from your original purchase page.",
    unpaid: "We couldn't find a completed payment for this link.",
    expired: "This download link has expired (links last 14 days). Reply to your receipt email and we'll resend it.",
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
})();
