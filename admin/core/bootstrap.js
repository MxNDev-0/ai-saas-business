import { bootWatchdog } from "./core/mcn-boot-watchdog.js";
import { safeModule } from "./core/mcn-safe-render.js";

import { initPosts } from "../modules/posts.js";
import { initAds } from "../modules/ads.js";
import { initSupport } from "../modules/support.js";

export async function bootstrapMCN() {

  const boot = bootWatchdog("MCN CORE");

  console.log("🚀 Bootstrap starting...");

  safeModule(() => initPosts(), "posts");
  safeModule(() => initAds(), "ads");
  safeModule(() => initSupport(), "support");

  boot.success();

  console.log("✅ Bootstrap complete");
}