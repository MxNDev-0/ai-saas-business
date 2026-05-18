/* =========================================
   🚀 MCN BOOT STABILITY LAYER v2 (FIXED)
   HARD SEQUENCED + SAFE ENGINE + UI SYNC
========================================= */

import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";
import { startMonitor } from "./admin-monitor.js";
import { startAdminEngine } from "./admin/admin.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";

import "../mcn-core.js";
import "../mcn-event-bus.js";
import { startMCNHealing } from "../mcn-self-heal.js";
import { startMCNLive } from "../mcn-live-boot.js";

/* ================= GLOBAL LOCK ================= */

window.MCN_BOOT = window.MCN_BOOT || {
  state: "idle",
  locked: false
};

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

  window.MCN_AI = window.MCN_AI || { mode: "stable", risk: 0 };
  window.MCN_CONTROLS = window.MCN_CONTROLS || {};
  window.MCN_BUS = window.MCN_BUS || { emit: () => {}, on: () => {} };
}

/* ================= CONTROL BRIDGE ================= */

function startControls() {

  watchControls((data = {}) => {

    window.MCN_CONTROLS.featuredPostId = data.featuredPostId ?? null;
    window.MCN_CONTROLS.sponsoredPostId = data.sponsoredPostId ?? null;
    window.MCN_CONTROLS.adsEnabled = data.adsEnabled ?? true;
    window.MCN_CONTROLS.discoverEnabled = data.discoverEnabled ?? true;

  });
}

/* ================= MODULE START SEQUENCER ================= */

async function startModules(user) {

  ensureSystemState();

  startControls();
  startMCNHealing();
  startMonitor();
  startMCNLive();

  /* WAIT FOR DOM BEFORE ENGINE */
  await new Promise(r => {
    if (document.readyState !== "loading") return r();
    document.addEventListener("DOMContentLoaded", r);
  });

  /* PREVENT DOUBLE ENGINE LOAD */
  if (!window.__MCN_ENGINE_STARTED__) {
    window.__MCN_ENGINE_STARTED__ = true;
    startAdminEngine();
  }

  window.MCN_BUS.emit?.("system:boot", {
    user: user.uid,
    time: Date.now()
  });

  console.log("🧠 MCN FULL SYSTEM ACTIVE");
}

/* ================= BOOT ================= */

function boot() {

  if (window.MCN_BOOT.locked) return;
  window.MCN_BOOT.locked = true;

  initAdminGuard(async (user) => {

    try {

      window.MCN_BOOT.state = "auth-check";

      if (!user) {
        console.error("❌ No session");
        return;
      }

      window.MCN_BOOT.state = "role-check";

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data()?.role !== "admin") {
        console.error("❌ ACCESS DENIED");

        window.MCN_READY = false;
        window.MCN_ADMIN = null;

        window.MCN_BOOT.state = "denied";
        return;
      }

      console.log("✅ ADMIN VERIFIED");

      window.MCN_BOOT.state = "booting";

      window.MCN_ADMIN = user;
      window.MCN_READY = true;

      await startModules(user);

      window.MCN_BOOT.state = "ready";

      console.log("🚀 MCN BOOT COMPLETE");

    } catch (err) {

      window.MCN_BOOT.state = "error";

      console.error("❌ BOOT FAILURE:", err);

      const monitor = document.getElementById("monitor");

      if (monitor) {
        monitor.innerHTML = `
          <div style="color:red;">
            🧠 MCN BOOT FAILED<br><br>
            State: ${window.MCN_BOOT.state}<br>
            Error: ${err.message}
          </div>
        `;
      }
    }

  });
}

boot();