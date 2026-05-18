/* =========================================
   🚀 MCN ADMIN CORE (CLEAN + REALISTIC)
========================================= */

import { db } from "../firebase.js";
import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";

/* =========================================
   GLOBAL STATE
========================================= */

window.MCN_READY = false;
window.MCN_ADMIN = null;

window.MCN_CONTROLS = {
  featuredPostId: null,
  sponsoredPostId: null,
  adsEnabled: true,
  discoverEnabled: true
};

/* =========================================
   SAFE LOG
========================================= */

function log(msg) {
  const box = document.getElementById("monitor");

  if (!box) return console.log("[MCN]", msg);

  const div = document.createElement("div");
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  div.style.color = "#00ff88";

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* =========================================
   CONTROL SYNC
========================================= */

function startControls() {

  watchControls((data = {}) => {

    window.MCN_CONTROLS.featuredPostId = data.featuredPostId ?? null;
    window.MCN_CONTROLS.sponsoredPostId = data.sponsoredPostId ?? null;
    window.MCN_CONTROLS.adsEnabled = data.adsEnabled ?? true;
    window.MCN_CONTROLS.discoverEnabled = data.discoverEnabled ?? true;

    log("⚙ Controls synced");
  });
}

/* =========================================
   REALTIME MONITOR (INLINE - NO MODULE)
========================================= */

function startMonitor() {

  import {
    doc,
    collection,
    onSnapshot
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  /* POSTS */
  onSnapshot(collection(db, "posts"), (snap) => {
    log(`📝 Posts: ${snap.size}`);
  });

  /* SUPPORT */
  onSnapshot(collection(db, "supportChats"), (snap) => {
    log(`💬 Support chats: ${snap.size}`);
  });

  /* EMERGENCY */
  onSnapshot(doc(db, "system", "emergency"), (snap) => {
    log(
      snap.data()?.enabled
        ? "🚨 Emergency ON"
        : "✅ Emergency OFF"
    );
  });

  /* CONTROLS */
  onSnapshot(doc(db, "system", "controls"), (snap) => {
    const d = snap.data() || {};
    log(`⚙ Ads: ${d.adsEnabled ? "ON" : "OFF"}`);
    log(`📰 Discover: ${d.discoverEnabled ? "ON" : "OFF"}`);
  });

  log("🖥 Monitor active");
}

/* =========================================
   BOOT ADMIN
========================================= */

function boot() {

  initAdminGuard((user) => {

    if (!user) {
      console.error("❌ Auth failed");
      return;
    }

    window.MCN_ADMIN = user;
    window.MCN_READY = true;

    log("✅ Admin verified");

    startControls();
    startMonitor();

    log("🚀 MCN Admin Active");
  });
}

/* =========================================
   INIT
========================================= */

boot();