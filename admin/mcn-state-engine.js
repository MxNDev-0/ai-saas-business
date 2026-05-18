/* =========================================
   🧠 MCN STATE ENGINE v1 (UNIFIED SYSTEM CORE)
   Fixes Monitor, Posts, Chat, Control Sync
========================================= */

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.MCN_STATE = window.MCN_STATE || {
  posts: [],
  supportChats: {},
  ads: [],
  system: window.MCN_SYSTEM,
  ai: window.MCN_AI
};

/* ================= FIRESTORE SYNC ================= */

function syncPosts() {

  const ref = collection(db, "posts");

  onSnapshot(ref, (snap) => {

    const posts = [];

    snap.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    window.MCN_STATE.posts = posts;
    window.MCN_SYSTEM.stats.posts = posts.length;
    window.MCN_SYSTEM.stats.lastEvent = "posts:sync";

  });
}

/* ================= SUPPORT CHAT SYNC ================= */

function syncSupport() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, (snap) => {

    const chats = {};

    snap.forEach(doc => {
      chats[doc.id] = doc.data();
    });

    window.MCN_STATE.supportChats = chats;
    window.MCN_SYSTEM.stats.supportChats = Object.keys(chats).length;
    window.MCN_SYSTEM.stats.lastEvent = "support:sync";

  });
}

/* ================= EVENT BRIDGE ================= */

function attachBus() {

  const BUS = window.MCN_BUS || window.MCN_EVENT_BUS;

  if (!BUS?.on) return;

  BUS.on("*", (event) => {
    window.__MCN_LAST_EVENT = event;
  });

}

/* ================= INIT ================= */

export function startMCNStateEngine() {

  if (window.__MCN_STATE_ENGINE_ACTIVE) return;
  window.__MCN_STATE_ENGINE_ACTIVE = true;

  attachBus();
  syncPosts();
  syncSupport();

  console.log("🧠 MCN STATE ENGINE ONLINE");
}