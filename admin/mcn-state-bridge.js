/* =========================================
   🧠 MCN STATE BRIDGE (PATCH LAYER)
   Converts ALL legacy writes into safe updates
========================================= */

import { updateSystem, updateAI, updatePrediction } from "./mcn-state-engine.js";

/* ================= LEGACY COMPAT LAYER ================= */

window.MCN_SYSTEM = window.MCN_SYSTEM || {};
window.MCN_AI = window.MCN_AI || {};
window.MCN_PREDICTION = window.MCN_PREDICTION || {};

/* ================= SAFE WRITERS ================= */

export function setPosts(value) {
  updateSystem({ stats: { posts: value } });
}

export function setSupportChats(value) {
  updateSystem({ stats: { supportChats: value } });
}

export function setErrorCount(value) {
  updateSystem({ stats: { errorCount: value } });
}

export function setHealth(value) {
  updateSystem({ health: value });
}

export function setEmergency(value) {
  updateSystem({ flags: { emergency: value } });
}

/* ================= FIRESTORE PATCH HELPERS ================= */

export function safeFirestorePostSync(snap) {
  updateSystem({ stats: { posts: snap.size } });
}

export function safeFirestoreSupportSync(snap) {
  updateSystem({ stats: { supportChats: snap.size } });
}

/* ================= EVENT SAFE EMITTER ================= */

export function emitState(event, data) {
  if (window.MCN_BUS?.emit) {
    window.MCN_BUS.emit(event, data);
  }
}

/* ================= AUTO SYNC GUARD ================= */

setInterval(() => {
  // prevents blank monitor crash
  if (!window.MCN_SYSTEM?.stats) {
    window.MCN_SYSTEM.stats = {
      posts: 0,
      supportChats: 0,
      errorCount: 0,
      lastEvent: "repair_patch"
    };
  }
}, 1000);

console.log("🧠 MCN STATE BRIDGE ONLINE");