/* =========================================
   MCN EVENT BUS v1
========================================= */

const listeners = {};

export function on(event, callback) {

  if (!listeners[event]) {
    listeners[event] = [];
  }

  listeners[event].push(callback);
}

export function off(event, callback) {

  if (!listeners[event]) return;

  listeners[event] =
    listeners[event].filter(cb => cb !== callback);
}

export function emit(event, data = {}) {

  console.log("📡 EVENT:", event, data);

  if (!listeners[event]) return;

  listeners[event].forEach(callback => {

    try {
      callback(data);
    } catch (e) {
      console.error("Event listener crash:", e);

      if (window.MCN_STATE) {
        window.MCN_STATE.stats.errors++;
      }
    }

  });
}

/* GLOBAL ACCESS */
window.MCN_EVENT_BUS = {
  on,
  off,
  emit
};

console.log("📡 MCN EVENT BUS READY");