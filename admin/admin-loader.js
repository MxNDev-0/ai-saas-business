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