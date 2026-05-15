/* =========================================
   MCN BOOT SYSTEM V2
========================================= */

export function bootMCN() {

  if (window.__MCN_BOOTED) return;
  window.__MCN_BOOTED = true;

  const overlay = document.createElement("div");

  overlay.id = "mcnBoot";

  overlay.style = `
    position:fixed;
    inset:0;
    background:#0b132b;
    color:#5bc0be;
    display:flex;
    justify-content:center;
    align-items:center;
    flex-direction:column;
    font-family:Arial;
    z-index:999999;
  `;

  overlay.innerHTML = `
    <h2>MCN Engine V19</h2>
    <p id="bootStatus">Starting system...</p>
  `;

  document.body.appendChild(overlay);

  const steps = [
    "Checking Firebase connection...",
    "Loading Admin modules...",
    "Verifying authentication...",
    "Starting Monitor engine...",
    "Loading Dashboard controls...",
    "Activating CMS layer...",
    "System Online ✔"
  ];

  let i = 0;
  const el = document.getElementById("bootStatus");

  const interval = setInterval(() => {

    if (i < steps.length) {
      el.innerText = steps[i];
      i++;
    } else {
      clearInterval(interval);

      setTimeout(() => {
        overlay.remove();
        window.dispatchEvent(new Event("MCN_READY"));
      }, 600);
    }

  }, 600);
}