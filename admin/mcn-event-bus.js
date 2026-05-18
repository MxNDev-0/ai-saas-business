/* =========================================
   🧠 MCN EVENT BUS v1 (GLOBAL CONNECTOR)
========================================= */

window.MCN_BUS = window.MCN_BUS || {
  listeners: {}
};

export function on(event, fn) {
  if (!window.MCN_BUS.listeners[event]) {
    window.MCN_BUS.listeners[event] = [];
  }
  window.MCN_BUS.listeners[event].push(fn);
}

export function emit(event, data) {

  const list = window.MCN_BUS.listeners[event] || [];

  for (const fn of list) {
    try {
      fn(data);
    } catch (e) {
      console.error("MCN BUS ERROR:", e);
    }
  }

  if (window.MCN_SYSTEM) {
    window.MCN_SYSTEM.stats.lastEvent = event;
  }

  console.log("[MCN BUS]", event, data);
}

window.MCN_BUS.on = on;
window.MCN_BUS.emit = emit;

console.log("🧠 MCN EVENT BUS ONLINE");