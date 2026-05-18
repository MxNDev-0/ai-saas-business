import { bootstrapMCN } from "./core/bootstrap.js";
import { savePost, deletePost } from "./modules/posts.js";
import { approveAd, rejectAd } from "./modules/ads.js";
import { openChat } from "./modules/support.js";

/* =========================================
   GLOBAL API (USED BY HTML BUTTONS)
========================================= */

window.MCN = {
  savePost,
  deletePost,
  approveAd,
  rejectAd,
  openChat
};

/* =========================================
   ENGINE START
========================================= */

export function startAdminEngine() {
  console.log("🚀 STARTING MCN CLEAN ARCHITECTURE...");
  bootstrapMCN();
  console.log("✅ MCN ADMIN READY");
}

/* expose globally */
window.startAdminEngine = startAdminEngine;