/* =========================================
   🧠 MCN EVENT KERNEL v1
   Event-Driven System Backbone (REAL-TIME OS LAYER)
========================================= */

window.MCN_EVENT_KERNEL = window.MCN_EVENT_KERNEL || {

  listeners: {},

  history: [],

  maxHistory: 100,

  state: {
    lastEvent: null,
    eventCount: 0
  },

  /* ================= REGISTER LISTENER ================= */
  on(event, callback) {

    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  },

  /* ================= EMIT EVENT ================= */
  emit(event, payload = {}) {

    this.state.lastEvent = event;
    this.state.eventCount++;

    /* store history */
    this.history.unshift({
      event,
      payload,
      time: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    /* debug log */
    console.log(`[MCN EVENT] ${event}`, payload);

    /* trigger listeners */
    const list = this.listeners[event] || [];
    list.forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        console.error("MCN listener error:", err);
      }
    });

    /* global fallback event */
    const global = this.listeners["*"] || [];
    global.forEach(fn => fn(event, payload));
  }
};