/* =========================================
🧠 MCN SELF-HEALING OS v1 — EVENT CONNECTED
========================================= */

import "./mcn-event-bus.js";
import { db } from "./firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

const BUS = window.MCN_EVENT_BUS;

window.MCN_HEAL = window.MCN_HEAL || {
  restarts: 0,
  lastFix: null,
  status: "stable"
};

/* ================= WATCHDOG ================= */

function watchdog() {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  BUS.emit("heal:watchdog", { health: s.health });

  if (s.health < 40) {
    attemptRecovery("low_health");
  }

  if (s.stats.posts === 0 && s.stats.supportChats === 0) {
    attemptRecovery("frozen_state");
  }
}

/* ================= RECOVERY ================= */

function attemptRecovery(reason) {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  window.MCN_HEAL.restarts++;

  if (reason === "low_health") {
    s.health = Math.min(100, s.health + 5);
  }

  if (reason === "frozen_state") {
    restartListeners();
    s.health = Math.min(100, s.health + 10);
  }

  window.MCN_HEAL.lastFix = { reason, time: Date.now() };

  BUS.emit("heal:recovery", { reason });
}

/* ================= LISTENER RECOVERY ================= */

function restartListeners() {

  onSnapshot(collection(db, "posts"), (snap) => {
    window.MCN_SYSTEM.stats.posts = snap.size;
  });

  onSnapshot(collection(db, "supportChats"), (snap) => {
    window.MCN_SYSTEM.stats.supportChats = snap.size;
  });

  BUS.emit("heal:listeners_restored", {});
}

/* ================= EVENT HOOKS ================= */

BUS.on("module:error", () => {
  attemptRecovery("module_failure");
});

BUS.on("kernel:tick", () => {
  watchdog();
});

/* ================= LOOP ================= */

setInterval(() => {
  watchdog();
}, 3000);

export function startMCNHealing() {
  console.log("🧠 MCN SELF-HEALING EVENT MODE ONLINE");
}