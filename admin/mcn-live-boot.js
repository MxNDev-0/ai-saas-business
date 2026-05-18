/* =========================================
🧠 MCN LIVE BOOTSTRAP ENGINE v1
"Make MCN Come Alive Layer"
========================================= */

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= SAFETY GUARD ================= */

window.MCN_LIVE = window.MCN_LIVE || {
  initialized: false,
  heartbeat: 0,
  liveFeeds: {
    posts: false,
    support: false,
    system: false
  }
};

/* ================= HEARTBEAT ENGINE ================= */

function pulse() {
  const s = window.MCN_SYSTEM;

  if (!s) return;

  window.MCN_LIVE.heartbeat++;

  s.stats.lastEvent = "heartbeat";

  // small dynamic drift so system never feels "dead"
  s.health = Math.min(100, s.health + 0.05);

  if (window.MCN_AI) {
    window.MCN_AI.risk = Math.max(0, window.MCN_AI.risk - 0.1);
  }
}

/* ================= FEED DETECTOR ================= */

function attachFeeds() {

  /* POSTS FEED */
  onSnapshot(collection(db, "posts"), (snap) => {

    window.MCN_LIVE.liveFeeds.posts = true;

    window.MCN_SYSTEM.stats.posts = snap.size;
    window.MCN_SYSTEM.stats.lastEvent = "posts:update";

    console.log("🧠 MCN LIVE: posts feed active");
  });

  /* SUPPORT FEED */
  onSnapshot(collection(db, "supportChats"), (snap) => {

    window.MCN_LIVE.liveFeeds.support = true;

    window.MCN_SYSTEM.stats.supportChats = snap.size;
    window.MCN_SYSTEM.stats.lastEvent = "support:update";

    console.log("🧠 MCN LIVE: support feed active");
  });

  /* SYSTEM FEED */
  onSnapshot(collection(db, "system"), () => {

    window.MCN_LIVE.liveFeeds.system = true;

    console.log("🧠 MCN LIVE: system feed active");
  });
}

/* ================= SELF-HEALING DATA SEED (DEV SAFE) ================= */

async function seedIfEmpty() {

  try {

    const hasPosts = window.MCN_SYSTEM.stats.posts > 0;

    if (!hasPosts) {

      console.warn("⚠ MCN LIVE: No posts detected — seeding demo data");

      await addDoc(collection(db, "posts"), {
        title: "MCN System Activated",
        content: "Live bootstrap test post",
        createdAt: serverTimestamp(),
        system: true
      });
    }

  } catch (e) {
    console.error("MCN SEED ERROR:", e);
  }
}

/* ================= AI WAKE-UP SIGNAL ================= */

function awakenAI() {

  if (!window.MCN_AI) return;

  const s = window.MCN_SYSTEM;

  let baseRisk = 0;

  if (s.stats.posts === 0) baseRisk += 20;
  if (s.stats.supportChats === 0) baseRisk += 15;

  window.MCN_AI.risk = baseRisk;

  window.MCN_AI.mode =
    baseRisk > 40 ? "warning" :
    baseRisk > 20 ? "watch" :
    "stable";
}

/* ================= BOOT CHECK ================= */

function systemCheck() {

  const l = window.MCN_LIVE.liveFeeds;

  const allAlive = l.posts && l.support;

  if (allAlive) {
    console.log("🟢 MCN LIVE SYSTEM FULLY ACTIVE");
  } else {
    console.warn("🟡 MCN LIVE PARTIAL STATE DETECTED", l);
  }
}

/* ================= START ENGINE ================= */

export function startMCNLive() {

  if (window.MCN_LIVE.initialized) return;

  window.MCN_LIVE.initialized = true;

  attachFeeds();

  setInterval(() => {
    pulse();
    awakenAI();
  }, 2000);

  setInterval(() => {
    systemCheck();
  }, 5000);

  seedIfEmpty();

  console.log("🚀 MCN LIVE BOOTSTRAP ENGINE ONLINE");
}