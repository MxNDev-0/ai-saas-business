/* =========================================
   🚀 MCN ADMIN BOOT (RECONNECTED CORE)
   Event Kernel + Monitor + Healing + Live Layer
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

/* ================= SYSTEM BOOT ================= */

function boot() {

  initAdminGuard((user) => {

    if (!user) {
      console.error("❌ Admin auth failed");
      return;
    }

    window.MCN_ADMIN = user;
    window.MCN_READY = true;

    console.log("✅ MCN ADMIN ONLINE");

    /* ================= START LAYERS ================= */

    startControls();
    startMCNHealing();
    startMonitor();
    startMCNLive();

    /* ================= SIGNAL ================= */

    if (window.MCN_BUS?.emit) {
      window.MCN_BUS.emit("system:boot", {
        user: user.uid,
        time: Date.now()
      });
    }

    console.log("🧠 MCN FULL SYSTEM ACTIVE");

  });

}

boot();