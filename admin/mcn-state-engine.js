/* =========================================
   🧠 MCN STATE ENGINE v1 (FULL BRIDGE LAYER)
   Connects: Backend + Firestore + Monitor + UI
========================================= */

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const API = "https://mxm-backend.onrender.com";

window.MCN_STATE = window.MCN_STATE || {
  posts: [],
  ads: [],
  support: {},
  loading: true
};

/* ================= POSTS (BACKEND API) ================= */

async function syncBackendPosts() {
  try {
    const res = await fetch(`${API}/blog/list`);
    const data = await res.json();

    window.MCN_STATE.posts = data || [];

    if (window.MCN_SYSTEM) {
      window.MCN_SYSTEM.stats.posts = data.length;
      window.MCN_SYSTEM.stats.lastEvent = "posts:api_sync";
    }

  } catch (err) {
    console.error("POST SYNC ERROR:", err);
  }
}

/* ================= ADS (BACKEND API) ================= */

async function syncAds() {
  try {
    const res = await fetch(`${API}/ads/list`);
    const data = await res.json();

    window.MCN_STATE.ads = data || [];

  } catch (err) {
    console.error("ADS SYNC ERROR:", err);
  }
}

/* ================= SUPPORT (FIRESTORE REALTIME) ================= */

function syncSupport() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, (snap) => {

    const chats = {};

    snap.forEach(doc => {
      chats[doc.id] = doc.data();
    });

    window.MCN_STATE.support = chats;

    if (window.MCN_SYSTEM) {
      window.MCN_SYSTEM.stats.supportChats =
        Object.keys(chats).length;

      window.MCN_SYSTEM.stats.lastEvent =
        "support:firestore_sync";
    }

  });
}

/* ================= STATE LOOP ================= */

function loopSync() {

  syncBackendPosts();
  syncAds();

}

/* ================= INIT ENGINE ================= */

export function startMCNStateEngine() {

  if (window.__MCN_STATE_ENGINE) return;
  window.__MCN_STATE_ENGINE = true;

  syncSupport();
  loopSync();

  setInterval(loopSync, 8000);

  console.log("🧠 MCN STATE ENGINE ONLINE");
}