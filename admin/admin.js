import { bootstrapMCN } from "./core/bootstrap.js";

import {
  savePost,
  deletePost
} from "./modules/posts.js";

import {
  approveAd,
  rejectAd
} from "./modules/ads.js";

import {
  openChat
} from "./modules/support.js";

window.MCN = {
  savePost,
  deletePost,
  approveAd,
  rejectAd,
  openChat
};

export async function startAdminEngine() {

  console.log("🚀 Starting MCN modular engine...");

  bootstrapMCN();

  // 🔥 IMPORTANT: explicitly start modules
  const posts = await import("./modules/posts.js");
  const ads = await import("./modules/ads.js");
  const support = await import("./modules/support.js");

  posts.initPosts?.();
  ads.initAds?.();
  support.initSupport?.();

  console.log("✅ MCN modular engine ready");
}

window.startAdminEngine = startAdminEngine;