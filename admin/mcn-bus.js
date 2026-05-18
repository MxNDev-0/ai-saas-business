/* =========================================
   🧠 MCN EVENT-DRIVEN KERNEL BUS
   Single Communication Layer (SOURCE OF TRUTH)
========================================= */

window.MCN_BUS = window.MCN_BUS || {

  listeners: {},

  history: [],

  system: {
    lastEvent: null,
    eventCount: 0
  },

  /* ================= SUBSCRIBE ================= */

  on(event, callback) {

    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  },

  /* ================= EMIT ================= */

  emit(event, payload = null) {

    this.system.lastEvent = event;
    this.system.eventCount++;

    this.history.push({
      event,
      payload,
      time: Date.now()
    });

    // prevent memory explosion
    if (this.history.length > 200) {
      this.history.shift();
    }

    const list = this.listeners[event] || [];

    list.forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        console.error("🧠 MCN BUS ERROR:", event, err);
      }
    });

    // global debug trace
    console.log(`[MCN BUS] ${event}`, payload);
  },

  /* ================= GET HISTORY ================= */

  getHistory(event) {
    return this.history.filter(h => h.event === event);
  }
};