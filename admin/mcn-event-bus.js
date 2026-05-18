/* =========================================
   🧠 MCN EVENT BUS v1
   Global Reactive Backbone (REAL OS SIGNAL LAYER)
========================================= */

window.MCN_EVENT_BUS = window.MCN_EVENT_BUS || {

  listeners: {},

  emit(event, data = {}) {

    window.MCN_SYSTEM = window.MCN_SYSTEM || {};
    window.MCN_SYSTEM.stats = window.MCN_SYSTEM.stats || {};

    window.MCN_SYSTEM.stats.lastEvent = event;

    console.log(`[MCN EVENT] ${event}`, data);

    (this.listeners[event] || []).forEach(fn => fn(data));
    (this.listeners["*"] || []).forEach(fn => fn(event, data));
  },

  on(event, fn) {

    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(fn);
  }
};