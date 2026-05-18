/* =========================================
   🚀 MCN ADMIN CORE (DEDUPLICATED)
   Single Orchestrator, No Repetition
========================================= */

import { db } from "../firebase.js";

import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";

import { initMonitor } from "../modules/monitor.js";
import { initBlog } from "../modules/blog.js";
import { initSupport } from "../modules/support.js";

/* =========================================
   GLOBAL STATE
========================================= */

window.MCN_READY = false;
window.MCN_ADMIN = null;

window.MCN_CONTROLS = {
  featuredPostId: null,
  sponsoredPostId: null,
  adsEnabled: true,
  discoverEnabled: true
};

/* =========================================
   SAFE LOG
========================================= */

function log(msg) {
  const box = document.getElementById("monitor");

  if (!box) return console.log("[MCN]", msg);

  const div = document.createElement("div");
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  div.style.color = "#00ff88";

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* =========================================
   MODULE STARTER (NO TRY/CATCH DUPLICATION)
========================================= */

function startModule(name, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`${name} failed:`, e);
  }
}

/* =========================================
   START SYSTEMS
========================================= */

function startSystems(user) {

  startModule("Monitor", () => initMonitor(db));
  startModule("Blog", () => initBlog(db, user));
  startModule("Support", () => initSupport(db, user));

  log("🧩 Modules started");
}

/* =========================================
   CONTROL SYNC
========================================= */

function startControls() {

  watchControls((data = {}) => {

    window.MCN_CONTROLS = {
      featuredPostId: data.featuredPostId ?? null,
      sponsoredPostId: data.sponsoredPostId ?? null,
      adsEnabled: data.adsEnabled ?? true,
      discoverEnabled: data.discoverEnabled ?? true
    };

    log("⚙ Controls synced");
  });
}

/* =========================================
   BOOT ADMIN
========================================= */

function boot() {

  initAdminGuard((user) => {

    if (!user) {
      console.error("❌ Auth failed");
      return;
    }

    window.MCN_ADMIN = user;
    window.MCN_READY = true;

    log("✅ Admin verified");

    startControls();
    startSystems(user);

    log("🚀 MCN Admin Active");
  });
}

/* =========================================
   INIT
========================================= */

boot();