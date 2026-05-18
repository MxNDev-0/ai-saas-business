import { startAdminEngine } from "./admin.js";

/* =========================================
   MCN ADMIN LOADER V8 (STABLE BOOT)
========================================= */

(async function () {

  console.log("🧠 MCN Boot V8 starting...");

  const loaded = {};

  async function safeImport(path) {
    try {
      const mod = await import(path);
      loaded[path] = true;
      console.log("✅ Loaded:", path);
      return mod;
    } catch (e) {
      loaded[path] = false;
      console.error("❌ Failed:", path, e);
      return null;
    }
  }

  /* =========================================
     GLOBAL MONITOR LOGGER
  ========================================= */

  window.logToMonitor = function (msg, type = "ok") {
    const box = document.getElementById("monitor");
    if (!box) return;

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
     CORE MODULES
  ========================================= */

  await safeImport("./firebase.js");

  await safeImport("./admin-auth.js");
  await safeImport("./admin-control.js");
  await safeImport("./admin-monitor.js");

  await safeImport("./admin.js");
  await safeImport("./admin/ai-engine.js");

  await safeImport("./emergency-control.js");

  try {
    await safeImport("./admin-chat.js");
  } catch (e) {
    console.warn("⚠ Optional chat module missing");
  }

  /* =========================================
     START MONITOR ENGINE
  ========================================= */

  const monitorModule = await import("./admin-monitor.js").catch(() => null);

  if (monitorModule?.startMonitor) {
    monitorModule.startMonitor();
    console.log("🖥 Monitor engine started");
  }

  /* =========================================
     READY SIGNAL
  ========================================= */

  console.log("📦 MODULE LOAD REPORT:", loaded);

  setTimeout(() => {
    console.log("🚀 MCN ENGINE FULLY READY");
    logToMonitor("🚀 MCN ENGINE FULLY READY");

    window.dispatchEvent(new Event("mcn-ready"));

    /* ✅ SINGLE SAFE BOOT (ONLY HERE) */
    startAdminEngine();

  }, 800);

})();