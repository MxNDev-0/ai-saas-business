/* =========================================
   🚀 MCN ADMIN CORE — PHASE 3 (ENTERPRISE)
   Event System + Health Engine + Telemetry
========================================= */

import { db } from "../firebase.js";
import { initAdminGuard } from "./admin-auth.js";
import { watchControls } from "./admin-control.js";

import {
  doc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

window.MCN_SYSTEM = {
  health: 100,

  stats: {
    posts: 0,
    supportChats: 0,
    errors: 0,
    lastEvent: null
  },

  flags: {
    emergency: false,
    degraded: false
  }
};

/* =========================================
   EVENT BUS (CORE ENGINE)
========================================= */

window.MCN_BUS = {
  listeners: {},

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  },

  emit(event, data) {
    window.MCN_SYSTEM.stats.lastEvent = event;

    const list = this.listeners[event] || [];
    list.forEach(fn => fn(data));

    console.log(`[MCN EVENT] ${event}`, data);
  }
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
   HEALTH ENGINE
========================================= */

function updateHealth() {

  const s = window.MCN_SYSTEM;

  let score = 100;

  if (s.stats.errors > 0) score -= s.stats.errors * 5;
  if (s.flags.emergency) score -= 30;
  if (s.stats.supportChats > 50) score -= 10;

  if (score < 0) score = 0;

  s.health = score;
  s.flags.degraded = score < 60;

  return score;
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
   MONITOR (TELEMETRY ENGINE)
========================================= */

function startMonitor() {

  /* POSTS */
  onSnapshot(collection(db, "posts"), (snap) => {
    window.MCN_SYSTEM.stats.posts = snap.size;
    window.MCN_BUS.emit("posts:update", snap.size);
  });

  /* SUPPORT */
  onSnapshot(collection(db, "supportChats"), (snap) => {
    window.MCN_SYSTEM.stats.supportChats = snap.size;
    window.MCN_BUS.emit("support:update", snap.size);
  });

  /* EMERGENCY */
  onSnapshot(doc(db, "system", "emergency"), (snap) => {
    const enabled = snap.data()?.enabled || false;

    window.MCN_SYSTEM.flags.emergency = enabled;

    window.MCN_BUS.emit("emergency", enabled);
  });

  /* CONTROLS */
  onSnapshot(doc(db, "system", "controls"), (snap) => {
    const d = snap