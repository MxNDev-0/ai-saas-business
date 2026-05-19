/* =========================================
   MCN BOOTSTRAP SYSTEM
========================================= */

// 🧠 GLOBAL MIGRATION MODE (ONLY ONCE HERE)
window.__MCN_MIGRATION_MODE = true;

// 🧠 LOAD STATE CORE FIRST
import "./state.js";

// 📡 LOAD EVENT BUS
import "./event-bus.js";

import { initPosts } from "../modules/posts.js";
import { initAds } from "../modules/ads.js";
import { initSupport } from "../modules/support.js";

export function bootstrapMCN() {

  console.log("🚀 Bootstrap starting...");

  // 🧠 STATE UPDATE
  window.MCN_STATE.system.initialized = false;
  window.MCN_STATE.ui.loading = true;

  // SAFE WRAPPED INIT (NO CRASH STOPPING EVERYTHING)

  try {

    initPosts?.();

  } catch (e) {

    console.error("Posts failed", e);

    window.MCN_STATE.stats.errors++;
  }

  try {

    initAds?.();

  } catch (e) {

    console.error("Ads failed", e);

    window.MCN_STATE.stats.errors++;
  }

  try {

    initSupport?.();

  } catch (e) {

    console.error("Support failed", e);

    window.MCN_STATE.stats.errors++;
  }

  // 🧠 FINALIZE STATE
  window.MCN_STATE.system.initialized = true;
  window.MCN_STATE.ui.loading = false;

  // 📡 EVENT BUS
  window.MCN_EVENT_BUS.emit("bootstrap:complete");

  console.log("✅ Bootstrap complete");
}