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

export function startAdminEngine() {

  console.log("🚀 Starting MCN modular engine...");

  bootstrapMCN();

  console.log("✅ MCN modular engine ready");
}

window.startAdminEngine = startAdminEngine;