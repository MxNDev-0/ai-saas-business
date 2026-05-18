/* =========================================
🧠 MCN SELF-HEALING OS v1
Recovery Kernel + Watchdog + Auto-Restarter
========================================= */

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HEALING STATE ================= */

window.MCN_HEAL = window.MCN_HEAL || {
  restarts: 0,
  lastFix: null,
  failedListeners: {},
  status: "stable"
};

/* ================= WATCHDOG SYSTEM ================= */

function watchdog() {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  // detect silent failure state
  const isFrozen =
    s.stats.posts === 0 &&
    s.stats.supportChats === 0 &&
    s.stats.lastEvent === null;

  if (isFrozen) {
    console.warn("🧠 MCN WATCHDOG: System appears frozen");
    attemptRecovery("frozen_state");
  }

  // detect degraded system
  if (s.health < 40) {
    console.warn("🧠 MCN WATCHDOG: Low health detected");
    attemptRecovery("low_health");
  }
}

/* ================= LISTENER RECOVERY ================= */

function restartListeners() {

  try {

    /* POSTS */
    onSnapshot(collection(db, "posts"), (snap) => {
      window.MCN_SYSTEM.stats.posts = snap.size;
      window.MCN_SYSTEM.stats.lastEvent = "posts:recovered";
    });

    /* SUPPORT */
    onSnapshot(collection(db, "supportChats"), (snap) => {
      window.MCN_SYSTEM.stats.supportChats = snap.size;
      window.MCN_SYSTEM.stats.lastEvent = "support:recovered";
    });

    console.log("🟢 MCN SELF-HEAL: Listeners restored");

  } catch (e) {
    console.error("❌ Listener recovery failed", e);
  }
}

/* ================= CORE RECOVERY ENGINE ================= */

function attemptRecovery(reason) {

  const s = window.MCN_SYSTEM;

  if (!s) return;

  window.MCN_HEAL.restarts++;

  let action = "none";

  switch (reason) {

    case "frozen_state":
      restartListeners();
      s.health = Math.min(100, s.health + 10);
      action = "listener_restart";
      break;

    case "low_health":
      s.health = Math.min(100, s.health + 5);
      s.stats.errorCount += 1;
      action = "health_boost";
      break;

    default:
      s.health = Math.min(100, s.health + 2);
      action = "soft_recovery";
  }

  window.MCN_HEAL.lastFix = {
    reason,
    action,
    time: Date.now()
  };

  window.MCN_HEAL.status = "recovering";

  console.log("🧠 MCN HEAL ACTION:", action);
}

/* ================= MODULE REPAIR ================= */

function repairModules() {

  const kernel = window.MCN_KERNEL;
  if (!kernel || !kernel.modules) return;

  Object.keys(kernel.modules).forEach(name => {

    const m = kernel.modules[name];

    // revive stuck modules
    if (m.status === "failed" && m.errors < 5) {
      console.warn("🟡 MCN HEAL: Reviving module", name);
      m.status = "active";
    }

    // isolate unstable modules
    if (m.errors >= 5) {
      console.warn("🔴 MCN HEAL: Isolating module", name);
      m.status = "isolated";
    }
  });
}

/* ================= SELF STABILIZER ================= */

function stabilizer() {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  if (s.stats.errorCount > 20) {
    s.stats.errorCount = 10; // cap runaway errors
  }

  if (s.health < 100 && !s.flags.emergency) {
    s.health += 0.3; // slow recovery
  }
}

/* ================= MAIN LOOP ================= */

function startSelfHealing() {

  setInterval(() => {

    watchdog();
    repairModules();
    stabilizer();

  }, 3000);

  console.log("🧠 MCN SELF-HEALING OS ONLINE");
}

/* ================= BOOT ================= */

export function startMCNHealing() {
  startSelfHealing();
}