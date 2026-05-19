import { bootstrapMCN } from "./core/bootstrap.js";

import { savePost, deletePost, initPosts } from "./modules/posts.js";
import { approveAd, rejectAd, initAds } from "./modules/ads.js";
import { openChat, initSupport } from "./modules/support.js";

/* ================= GLOBAL API ================= */

window.MCN = {
  savePost,
  deletePost,
  approveAd,
  rejectAd,
  openChat
};

/* ================= ENGINE START ================= */

export async function startAdminEngine() {

  console.log("🚀 MCN ENGINE STARTING...");

  try {

    /* 1. BOOTSTRAP CORE */
    await bootstrapMCN();

    /* 2. INIT MODULES ONLY ONCE */
    await initPosts?.();
    await initAds?.();
    await initSupport?.();

    console.log("✅ MCN ENGINE READY");

  } catch (err) {

    console.error("❌ ENGINE FAILED:", err);
  }
}

window.startAdminEngine = startAdminEngine;