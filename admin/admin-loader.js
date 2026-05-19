/* =========================================
   MCN ADMIN LOADER V9 FIXED
   HARD SAFE BOOT
========================================= */

import { startAdminEngine } from "./admin.js";

function bootLog(msg) {
  const box = document.getElementById("monitor");

  if (box) {
    box.innerHTML += `<div>${msg}</div>`;
  }

  console.log(msg);
}

/* NEVER BLANK SCREEN GUARANTEE */
function keepAliveUI() {
  const required = [
    "monitor",
    "postsList",
    "dashPosts",
    "upgradeList"
  ];

  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (!el.innerHTML.trim()) {
      el.innerHTML = `<div style="opacity:0.6">Waiting for data...</div>`;
    }
  });
}

window.addEventListener("error", (e) => {
  bootLog("❌ " + e.message);
});

window.addEventListener("load", async () => {

  bootLog("🚀 SAFE SYSTEM BOOT");

  try {

    await startAdminEngine();

    bootLog("✅ ENGINE STARTED");

    // keep UI alive every 2s
    setInterval(keepAliveUI, 2000);

  } catch (e) {
    bootLog("❌ CRITICAL FAIL: " + e.message);
  }
});

/* ================= MONITOR ================= */

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

/* ================= GLOBAL ERROR ================= */

window.addEventListener("error", (e) => {
  console.error("GLOBAL ERROR:", e.message);

  if (window.logToMonitor) {
    window.logToMonitor("❌ " + e.message, "error");
  }
});

/* ================= SAFE BOOT ================= */

window.addEventListener("load", async () => {

  logToMonitor("🚀 MCN SAFE BOOT STARTING...");

  try {

    const modules = [
      "./admin-auth.js",
      "./admin-control.js",
      "./admin-monitor.js",
      "./admin-chat.js",
      "./emergency-control.js",
      "./admin/ai-engine.js"
    ];

    for (const m of modules) {
      try {
        await import(m);
        logToMonitor("✅ Loaded " + m);
      } catch (err) {
        logToMonitor("⚠ Failed " + m, "warn");
        console.warn(err);
      }
    }

    if (typeof startAdminEngine !== "function") {
      logToMonitor("❌ Engine not found", "error");
      return;
    }

    startAdminEngine();

    logToMonitor("✅ MCN ADMIN READY");

  } catch (e) {
    logToMonitor("❌ BOOT CRASH: " + e.message, "error");
    console.error(e);
  }

});