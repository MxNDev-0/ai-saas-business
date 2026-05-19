import { initPosts } from "../modules/posts.js";
import { initAds } from "../modules/ads.js";
import { initSupport } from "../modules/support.js";

export async function bootstrapMCN() {

  console.log("🚀 Bootstrap SAFE MODE starting...");

  const tasks = [
    ["Posts", initPosts],
    ["Ads", initAds],
    ["Support", initSupport]
  ];

  for (const [name, fn] of tasks) {

    try {

      if (typeof fn === "function") {
        await fn();
        console.log("✅ " + name);
      } else {
        console.warn("⚠ Missing:", name);
      }

    } catch (e) {
      console.error("❌ Failed module:", name, e);
    }
  }

  window.MCN_STATE.ready = true;

  console.log("✅ Bootstrap SAFE MODE complete");
}