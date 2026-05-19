/* =========================================
   MCN UNIFIED STATE CORE v1
========================================= */

window.MCN_STATE = window.MCN_STATE || {

  system: {
    health: 100,
    online: true,
    initialized: false
  },

  stats: {
    posts: 0,
    users: 0,
    supportChats: 0,
    errors: 0
  },

  ai: {
    mode: "stable",
    risk: 0
  },

  controls: {
    adsEnabled: true,
    discoverEnabled: true
  },

  ui: {
    renderMode: "normal",
    loading: false
  }

};

console.log("🧠 MCN STATE READY");