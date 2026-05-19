/* =========================================
   MCN ADMIN LOADER V9
   CLEAN MODULAR ARCHITECTURE
========================================= */

import { startAdminEngine } from "./admin.js";

/* =========================================
   GLOBAL MONITOR LOGGER
========================================= */

window.logToMonitor = function (msg, type = "ok") {

  const box = document.getElementById("monitor");

  if (!box) {
    console.warn("[MONITOR]", msg);
    return;
  }

  const div = document.createElement("div");

  div.style.color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    "#00ff88";

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;
};

/* =========================================
   GLOBAL ERROR GUARD
========================================= */

window.addEventListener("error", (e) => {

  console.error("GLOBAL ERROR:", e.message);

  logToMonitor(
    "❌ ERROR: " + e.message,
    "error"
  );
});

/* =========================================
   SAFE BOOT
========================================= */

window.addEventListener("load", async () => {

  console.log("🚀 MCN SYSTEM BOOT");

  logToMonitor("🧠 Initializing MCN modules...");

  try {

    /* optional systems */
    await import("./admin-auth.js").catch(() => {});
    await import("./admin-control.js").catch(() => {});
    await import("./admin-monitor.js").catch(() => {});
    await import("./admin-chat.js").catch(() => {});
    await import("./emergency-control.js").catch(() => {});
    await import("./admin/ai-engine.js").catch(() => {});

    /* START MAIN ENGINE */
    startAdminEngine();

    logToMonitor("✅ MCN ADMIN READY");

    console.log("✅ MCN fully initialized");

  } catch (e) {

    console.error(e);

    logToMonitor(
      "❌ Boot failure: " + e.message,
      "error"
    );
  }

});