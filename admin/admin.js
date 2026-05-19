import { bootstrapMCN } from "./core/bootstrap.js";
import { initPosts } from "./modules/posts.js";
import { initAds } from "./modules/ads.js";
import { initSupport } from "./modules/support.js";

window.MCN = window.MCN || {};

export async function startAdminEngine() {
  console.log("🚀 ENGINE INIT");

  bootstrapMCN();

  // SAFE SEQUENTIAL INIT (NOT PARALLEL CRASH)
  await initPosts?.();
  await initAds?.();
  await initSupport?.();

  console.log("✅ ENGINE READY");
}

window.startAdminEngine = startAdminEngine;