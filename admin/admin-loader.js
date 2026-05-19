import "./state.js";
import "./event-bus.js";

import { initPosts } from "./modules/posts.js";

window.addEventListener("DOMContentLoaded", async () => {

  console.log("🚀 MCN SINGLE CORE BOOT START");

  // 🧠 MARK SYSTEM INITIALIZING
  window.MCN_STATE.system.initialized = false;
  window.MCN_STATE.ui.loading = true;

  const monitor = document.getElementById("monitor");

  function log(msg) {
    console.log(msg);

    if (monitor) {
      monitor.innerHTML += `<div>${msg}</div>`;
    }
  }

  try {

    log("🧠 Starting engine...");

    await initPosts();

    // 🧠 STATE SYNC
    window.MCN_STATE.system.initialized = true;
    window.MCN_STATE.ui.loading = false;

    // 📡 EVENT BUS
    window.MCN_EVENT_BUS.emit("admin:ready");

    log("✅ Posts loaded");

    log("🚀 ADMIN READY");

  } catch (e) {

    console.error(e);

    // 🧠 ERROR TRACKING
    window.MCN_STATE.stats.errors++;

    log("❌ BOOT ERROR: " + e.message);
  }
});