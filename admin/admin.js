/* =========================================
   🚀 MCN ADMIN BOOT (CLEAN ENTRY POINT)
   ONLY RESPONSIBILITY: START SYSTEM
========================================= */

import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";

import { startMonitor } from "./admin-monitor.js";

/* =========================================
   BOOT MCN CORE
========================================= */

import "../mcn-core.js";

/* =========================================
   GLOBAL FLAGS
========================================= */

window.MCN_READY = false;
window.MCN_ADMIN = null;

/* =========================================
   CONTROL SYNC (ONLY BRIDGE)
========================================= */

function startControls() {

  watchControls((data = {}) => {

    if (!window.MCN_CONTROLS) return;

    window.MCN_CONTROLS.featuredPostId = data.featuredPostId ?? null;
    window.MCN_CONTROLS.sponsoredPostId = data.sponsoredPostId ?? null;
    window.MCN_CONTROLS.adsEnabled = data.adsEnabled ?? true;
    window.MCN_CONTROLS.discoverEnabled = data.discoverEnabled ?? true;

  });
}

/* =========================================
   BOOT SYSTEM
========================================= */

function boot() {

  initAdminGuard((user) => {

    if (!user) {
      console.error("❌ Admin auth failed");
      return;
    }

    window.MCN_ADMIN = user;
    window.MCN_READY = true;

    console.log("✅ MCN Admin Ready");

    startControls();
    startMonitor();

  });
}

boot();