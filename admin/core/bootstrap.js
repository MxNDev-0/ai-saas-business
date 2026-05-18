import { initPosts } from "../modules/posts.js";
import { initAds } from "../modules/ads.js";
import { initSupport } from "../modules/support.js";

export async function bootstrapMCN() {
  console.log("🚀 MCN CLEAN BOOT STARTING...");

  await initPosts();
  await initAds();
  await initSupport();

  console.log("✅ MCN FULLY STABLE");
}