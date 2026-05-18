window.MCN_BUS = window.MCN_BUS || {
  listeners: {}
};

/* ================= SUBSCRIBE ================= */

export function on(event, fn) {

  if (!window.MCN_BUS.listeners[event]) {
    window.MCN_BUS.listeners[event] = [];
  }

  window.MCN_BUS.listeners[event].push(fn);
}

/* ================= EMIT (WITH WILDCARD SUPPORT) ================= */

export function emit(event, data) {

  const bus = window.MCN_BUS;

  /* update system state */
  if (window.MCN_SYSTEM) {
    window.MCN_SYSTEM.stats.lastEvent = event;
  }

  console.log("[MCN BUS]", event, data);

  const listeners = bus.listeners || {};

  /* 1. direct listeners */
  const direct = listeners[event] || [];

  /* 2. wildcard listeners */
  const wildcard = listeners["*"] || [];

  const run = (fn) => {
    try {
      fn(event, data);
    } catch (e) {
      console.error("🧠 MCN BUS ERROR:", e);
    }
  };

  direct.forEach(run);
  wildcard.forEach(run);
}

/* ================= GLOBAL BIND ================= */

window.MCN_BUS.on = on;
window.MCN_BUS.emit = emit;

console.log("🧠 MCN EVENT BUS v1 FIXED + WILDCARD SUPPORT ONLINE");