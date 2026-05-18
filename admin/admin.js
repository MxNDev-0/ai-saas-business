/* =========================================  
   🚀 MCN ADMIN BOOT (RECONNECTED + SAFE MODE)  
   Event Kernel + Monitor + Healing + Live Layer  
   + FAILSAFE PROTECTION LAYER  
========================================= */

import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";
import { startMonitor } from "./admin-monitor.js";

import "../mcn-core.js";
import "../mcn-event-bus.js";
import { startMCNHealing } from "../mcn-self-heal.js";
import { startMCNLive } from "../mcn-live-boot.js";

/* ================= GLOBAL FLAGS ================= */

window.MCN_READY = false;
window.MCN_ADMIN = null;

/* ================= FAILSAFE SYSTEM INIT ================= */
/* 🔥 THIS FIXES YOUR BLANK SCREEN */

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

  });

}

/* ================= BOOT SYSTEM ================= */

function boot() {

  initAdminGuard((user) => {

    if (!user) {
      console.error("❌ Admin auth failed");
      return;
    }

    /* 🔥 CRITICAL: FORCE SYSTEM INIT BEFORE ANY MODULE */
    ensureSystemState();

    window.MCN_ADMIN = user;
    window.MCN_READY = true;

    console.log("✅ MCN ADMIN ONLINE");

    /* ================= START ORDER (IMPORTANT) ================= */

    try {

      startControls();

      startMCNHealing();

      startMonitor();

      startMCNLive();

      /* ================= SAFE EVENT SIGNAL ================= */

      window.MCN_BUS.emit?.("system:boot", {
        user: user.uid,
        time: Date.now()
      });

      console.log("🧠 MCN FULL SYSTEM ACTIVE");

    } catch (err) {

      console.error("❌ MCN BOOT ERROR:", err);

      /* 🔥 EMERGENCY FALLBACK */
      document.getElementById("monitor").innerHTML = `
        <div style="color:red;">
          🧠 MCN SAFE MODE ACTIVATED<br><br>
          Boot Error Detected:<br>
          ${err.message}
        </div>
      `;
    }

  });

}

boot();