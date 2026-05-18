/* =========================================
   🧠 MCN STATE SYNC LAYER (SINGLE SOURCE OF TRUTH)
========================================= */

window.MCN_STATE = {
  system: {},
  ai: {},
  modules: {}
};

/* ================= BUS LISTENERS ================= */

window.MCN_BUS = window.MCN_BUS || { on(){}, emit(){} };

/* SYSTEM SYNC */
window.MCN_BUS.on("system:update", (data) => {
  window.MCN_STATE.system = {
    ...window.MCN_STATE.system,
    ...data
  };
});

/* AI SYNC */
window.MCN_BUS.on("ai:update", (data) => {
  window.MCN_STATE.ai = data;
});

/* MODULE SYNC */
window.MCN_BUS.on("module:update", (data) => {
  window.MCN_STATE.modules[data.name] = data;
});