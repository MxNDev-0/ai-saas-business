/* =========================================
   MCN SAFE CORE v2 (ZERO-BLANK PROTECTION)
========================================= */

export function safe(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    console.error("SAFE ERROR:", e);

    if (window.logToMonitor) {
      window.logToMonitor("SAFE ERROR: " + e.message, "error");
    }

    return fallback;
  }
}

/* ========================================= */

export function mount(id, html, fallback = null) {
  const el = document.getElementById(id);

  if (!el) {
    console.warn("MOUNT FAIL: Missing element ->", id);

    if (window.logToMonitor) {
      window.logToMonitor(`Missing DOM: ${id}`, "warn");
    }

    return false;
  }

  try {
    el.innerHTML = html;
    return true;

  } catch (e) {
    console.error("Mount crash:", e);

    if (window.logToMonitor) {
      window.logToMonitor("Mount crash: " + id, "error");
    }

    if (fallback !== null) {
      el.innerHTML = fallback;
    }

    return false;
  }
}

/* ========================================= */

export function safeMount(id, html, fallback = "⚠ UI failed to load") {
  const el = document.getElementById(id);

  if (!el) {
    console.warn("SAFE MOUNT: missing ->", id);

    if (window.logToMonitor) {
      window.logToMonitor(`Missing UI container: ${id}`, "warn");
    }

    return false;
  }

  try {
    el.innerHTML = html;
    return true;

  } catch (e) {
    console.error("SAFE MOUNT ERROR:", e);

    if (window.logToMonitor) {
      window.logToMonitor("Render error in: " + id, "error");
    }

    el.innerHTML = fallback;
    return false;
  }
}