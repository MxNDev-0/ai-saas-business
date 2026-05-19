import { initPosts } from "../modules/posts.js";
import { initAds } from "../modules/ads.js";
import { initSupport } from "../modules/support.js";

export async function bootstrapMCN() {

  console.log("🚀 Bootstrap starting...");

  const modules = [
    { name: "Posts", fn: initPosts },
    { name: "Ads", fn: initAds },
    { name: "Support", fn: initSupport }
  ];

  for (const m of modules) {
    try {
      if (typeof m.fn === "function") {
        await m.fn();
        console.log("✅ " + m.name + " loaded");
      } else {
        console.warn("⚠ Missing module:", m.name);
      }
    } catch (e) {
      console.error("❌ " + m.name + " failed:", e);
    }
  }

  console.log("✅ Bootstrap complete");
}