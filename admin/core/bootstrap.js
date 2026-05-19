/* =========================================
   MCN BOOTSTRAP SYSTEM
========================================= */

// 🧠 GLOBAL MIGRATION MODE (ONLY ONCE HERE)
window.__MCN_MIGRATION_MODE = true;

import { initPosts } from "../modules/posts.js";
import { initAds } from "../modules/ads.js";
import { initSupport } from "../modules/support.js";

export function bootstrapMCN() {

  console.log("🚀 Bootstrap starting...");

  // SAFE WRAPPED INIT (NO CRASH STOPPING EVERYTHING)

  try {
    initPosts?.();
  } catch (e) {
    console.error("Posts failed", e);
  }

  try {
    initAds?.();
  } catch (e) {
    console.error("Ads failed", e);
  }

  try {
    initSupport?.();
  } catch (e) {
    console.error("Support failed", e);
  }

  console.log("✅ Bootstrap complete");
}