/* =========================================
   MCN DOM RECOVERY v1
========================================= */

export function getSafe(id) {
  const el = document.getElementById(id);

  if (!el) {
    console.warn("⚠ Missing DOM:", id);

    if (window.logToMonitor) {
      window.logToMonitor("Missing DOM: " + id, "warn");
    }

    return createFallback(id);
  }

  return el;
}

function createFallback(id) {
  const fallback = document.createElement("div");

  fallback.id = id;
  fallback.style.cssText =
    "padding:10px;color:#ffcc00;background:#111;border:1px solid #333;margin:5px 0;";

  fallback.innerText = `⚠ Missing UI: ${id} (auto-recovered)`;

  document.body.appendChild(fallback);

  return fallback;
}