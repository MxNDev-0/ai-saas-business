/* =========================================
   MCN ADMIN LOADER V10 (ZERO BLANK BOOT)
========================================= */

import { startAdminEngine } from "./admin.js";
import { bootWatchdog } from "./core/boot-watchdog.js";

const watchdog = bootWatchdog("MCN ADMIN");

/* =========================================
   GLOBAL LOGGER (SAFE)
========================================= */

window.logToMonitor = function (msg, type = "ok") {
  const box = document.getElementById("monitor");

  if (!box) return console.warn("[MONITOR]", msg);

  const div = document.createElement("div");

  div.style.color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    "#00ff88";

  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
};

/* =========================================
   SAFE BOOT FLOW (ORDER IS EVERYTHING)
========================================= */

async function boot() {
  try {
    console.log("🚀 MCN BOOT START");

    logToMonitor("🧠 Waiting for DOM...");

    // HARD GUARANTEE DOM READY
    await new Promise(res => {
      if (document.readyState === "complete") return res();
      window.addEventListener("DOMContentLoaded", res);
    });

    logToMonitor("✅ DOM READY");

    /* Core modules (non-blocking safe imports) */
    await Promise.all([
      import("./admin-auth.js").catch(() => {}),
      import("./admin-control.js").catch(() => {}),
      import("./admin-monitor.js").catch(() => {}),
      import("./admin-chat.js").catch(() => {}),
      import("./emergency-control.js").catch(() => {}),
      import("./admin/ai-engine.js").catch(() => {})
    ]);

    logToMonitor("📦 Core modules loaded");

    /* START ENGINE */
    await startAdminEngine();

    logToMonitor("🚀 ENGINE STARTED");

    watchdog.success();

    window.dispatchEvent(new Event("mcn-ready"));

    console.log("✅ MCN FULLY READY");

  } catch (e) {
    console.error(e);
    logToMonitor("❌ BOOT FAILED: " + e.message, "error");
  }
}

/* START */
boot(); 