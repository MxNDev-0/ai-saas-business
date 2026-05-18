/* =========================================  
   🚀 MCN ADMIN BOOT (RECONNECTED + SAFE MODE)  
   Event Kernel + Monitor + Healing + Live Layer  
   + STATE ENGINE CONNECTOR FIX  
========================================= */

import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";
import { startMonitor } from "./admin-monitor.js";
import { startAdminEngine } from "./admin/admin.js";

import "../mcn-core.js";
import "../mcn-event-bus.js";
import { startMCNHealing } from "../mcn-self-heal.js";
import { startMCNLive } from "../mcn-live-boot.js";

/* ================= GLOBAL FLAGS ================= */

window.MCN_READY = false;
window.MCN_ADMIN = null;

/* ================= SAFE SYSTEM INIT ================= */

function ensureSystemState() {

  window.MCN_SYSTEM = window.MCN_SYSTEM || {
    health: 100,
    stats: {
      posts: 0,
      users: 0,
      supportChats: 0,
      errorCount: 0,
      lastEvent: "boot:init"
    },
    flags: {
      emergency: false,
      degraded: false,
      autopilot: true
    }
  };

  window.MCN_AI = window.MCN_AI || {
    mode: "stable",
    risk: 0
  };

  window.MCN_CONTROLS = window.MCN_CONTROLS || {};

  window.MCN_BUS = window.MCN_BUS || {
    emit: () => {},
    on: () => {}
  };
}

/* ================= CONTROL BRIDGE ================= */

function startControls() {

  watchControls((data = {}) => {

    if (!window.MCN_CONTROLS) return;

    window.MCN_CONTROLS.featuredPostId = data.featuredPostId ?? null;
    window.MCN_CONTROLS.sponsoredPostId = data.sponsoredPostId ?? null;
    window.MCN_CONTROLS.adsEnabled = data.adsEnabled ?? true;
    window.MCN_CONTROLS.discoverEnabled = data.discoverEnabled ?? true;

    /* Live sync log */
    console.log("🎛 Controls updated", window.MCN_CONTROLS);
  });

}

/* ================= DOM READY SAFETY ================= */

function onReady(fn) {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(fn, 0);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

/* ================= BOOT SYSTEM ================= */

function boot() {

  initAdminGuard(async (user) => {

    if (!user) {
      console.error("❌ Admin auth failed");
      return;
    }

    ensureSystemState();

    window.MCN_ADMIN = user;
    window.MCN_READY = true;

    console.log("✅ MCN ADMIN ONLINE");

    try {

      startControls();
      startMCNHealing();
      startMonitor();
      startMCNLive();

      /* ================= STATE ENGINE CONNECT ================= */
      onReady(() => {
        try {
          startAdminEngine();
          console.log("🧠 STATE ENGINE CONNECTED");
        } catch (e) {
          console.error("STATE ENGINE ERROR:", e);
        }
      });

      /* ================= SAFE EVENT SIGNAL ================= */

      window.MCN_BUS.emit?.("system:boot", {
        user: user.uid,
        time: Date.now()
      });

      console.log("🧠 MCN FULL SYSTEM ACTIVE");

    } catch (err) {

      console.error("❌ MCN BOOT ERROR:", err);

      const monitor = document.getElementById("monitor");

      if (monitor) {
        monitor.innerHTML = `
          <div style="color:red;">
            🧠 MCN SAFE MODE ACTIVATED<br><br>
            Boot Error Detected:<br>
            ${err.message}
          </div>
        `;
      }
    }

  });

}

boot();