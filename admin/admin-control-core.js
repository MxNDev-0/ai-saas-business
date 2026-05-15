/* =========================================
   MCN CONTROL CORE V6
   CENTRAL COMMAND SYSTEM
========================================= */

import { setControl, watchControls } from "./admin-control.js";

/* GLOBAL STATE */
window.MCN = {
  controls: {},
  actions: {}
};

/* =========================================
   CONTROL STATE SYNC
========================================= */

watchControls((data) => {
  window.MCN.controls = data || {};
  console.log("📡 Controls synced:", data);
});

/* =========================================
   COMMAND REGISTRY (ANTI-ERROR CORE)
========================================= */

export function registerAction(name, fn) {
  window.MCN.actions[name] = fn;
  window[name] = fn; // fallback for old onclick buttons
}

/* =========================================
   SAFE RUNNER
========================================= */

function run(name, ...args) {
  const fn = window.MCN.actions[name];

  if (!fn) {
    console.error(`❌ Action not found: ${name}`);
    return;
  }

  return fn(...args);
}

window.MCN.run = run;

/* =========================================
   CONTROL ACTIONS
========================================= */

registerAction("setFeatured", async () => {

  const id = document.getElementById("featurePostId")?.value;

  await setControl("featuredPostId", id);

  console.log("⭐ Featured updated");
});

registerAction("setSponsored", async () => {

  const id = document.getElementById("sponsorPostId")?.value;
  const slot = document.getElementById("sponsorSlot")?.value;

  await setControl("sponsoredPostId", { id, slot });

  console.log("💰 Sponsored updated");
});

registerAction("toggleAds", async () => {

  const current = window.MCN.controls.adsEnabled ?? true;

  await setControl("adsEnabled", !current);

  console.log("📢 Ads toggled:", !current);
});

registerAction("toggleDiscover", async () => {

  const current = window.MCN.controls.discoverEnabled ?? true;

  await setControl("discoverEnabled", !current);

  console.log("🔍 Discover toggled:", !current);
});

/* =========================================
   OPTIONAL: SAFE LOG HOOK
========================================= */

export function bindLog(logFn) {
  window.MCN.log = logFn;
}