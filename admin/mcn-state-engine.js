/* =========================================
   🧠 MCN STATE ENGINE v1
   Single Source of Truth + Controlled Mutations
========================================= */

/* ================= STATE CORE ================= */

window.MCN_STATE = window.MCN_STATE || {
  system: {
    health: 100,
    stats: {
      posts: 0,
      users: 0,
      supportChats: 0,
      errorCount: 0,
      lastEvent: "boot"
    },
    flags: {
      emergency: false,
      degraded: false,
      autopilot: true
    }
  },

  ai: {
    mode: "stable",
    risk: 0
  },

  prediction: {
    riskScore: 0,
    zones: {
      system: 0,
      support: 0,
      content: 0,
      functions: 0
    },
    forecast: []
  }
};

/* ================= SAFE GETTERS ================= */

export function getState() {
  return window.MCN_STATE;
}

export function getSystem() {
  return window.MCN_STATE.system;
}

export function getAI() {
  return window.MCN_STATE.ai;
}

export function getPrediction() {
  return window.MCN_STATE.prediction;
}

/* ================= CONTROLLED UPDATES ================= */

export function updateSystem(partial = {}) {

  const s = window.MCN_STATE.system;

  window.MCN_STATE.system = {
    ...s,
    ...partial,
    stats: {
      ...s.stats,
      ...(partial.stats || {})
    },
    flags: {
      ...s.flags,
      ...(partial.flags || {})
    }
  };

  emitState("system:update", window.MCN_STATE.system);
}

export function updateAI(partial = {}) {

  window.MCN_STATE.ai = {
    ...window.MCN_STATE.ai,
    ...partial
  };

  emitState("ai:update", window.MCN_STATE.ai);
}

export function updatePrediction(partial = {}) {

  window.MCN_STATE.prediction = {
    ...window.MCN_STATE.prediction,
    ...partial,
    zones: {
      ...window.MCN_STATE.prediction.zones,
      ...(partial.zones || {})
    }
  };

  emitState("prediction:update", window.MCN_STATE.prediction);
}

/* ================= SAFE EVENT EMITTER ================= */

function emitState(event, data) {

  const bus = window.MCN_BUS || window.MCN_EVENT_BUS;

  if (bus?.emit) {
    bus.emit(event, data);
  }

  // always keep legacy compatibility alive
  window.MCN_SYSTEM = window.MCN_STATE.system;
  window.MCN_AI = window.MCN_STATE.ai;
  window.MCN_PREDICTION = window.MCN_STATE.prediction;
}

/* ================= AUTO SYNC BRIDGE ================= */

setInterval(() => {

  // force sync old systems (prevents blank monitor issue)
  window.MCN_SYSTEM = window.MCN_STATE.system;
  window.MCN_AI = window.MCN_STATE.ai;
  window.MCN_PREDICTION = window.MCN_STATE.prediction;

}, 1000);

console.log("🧠 MCN STATE ENGINE v1 ONLINE");