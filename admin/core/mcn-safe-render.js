/* =========================================  
   MCN SAFE RENDER v1 (MIGRATION SAFE)  
========================================= */

export function safeRender(id, html, fallback = null) {

  // 🧠 MIGRATION GUARD (prevents DOM overwrite during stabilization)
  if (window.__MCN_MIGRATION_MODE) {
    console.log("⏸ safeRender blocked (migration mode)");
    return;
  }

  const el = document.getElementById(id);

  try {

    if (!el) {
      console.warn("Render target missing:", id);

      if (window.logToMonitor) {
        window.logToMonitor("Render missing: " + id, "warn");
      }

      return false;
    }

    el.innerHTML = html;
    return true;

  } catch (e) {

    console.error("Render crash:", e);

    if (window.logToMonitor) {
      window.logToMonitor("Render crash: " + id, "error");
    }

    if (fallback) {
      el.innerHTML = fallback;
    }

    return false;
  }
}