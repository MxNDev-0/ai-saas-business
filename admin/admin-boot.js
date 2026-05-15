import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN CONTROL CENTER BOOT SEQUENCE
========================================= */

export function startBootSequence() {

  const monitor = document.getElementById("monitor");

  if (!monitor) return;

  const log = (msg, type = "ok") => {

    const div = document.createElement("div");

    div.style.marginBottom = "4px";

    div.style.color =
      type === "error" ? "red" :
      type === "warn" ? "orange" :
      type === "system" ? "#5bc0be" :
      "#00ff88";

    div.textContent =
      `[BOOT ${new Date().toLocaleTimeString()}] ${msg}`;

    monitor.appendChild(div);
    monitor.scrollTop = monitor.scrollHeight;
  };

  /* ================= BOOT SEQUENCE ================= */

  log("🔌 Powering MCN Engine...", "system");

  setTimeout(() => log("🧠 Loading Admin Core...", "system"), 500);
  setTimeout(() => log("🔥 Firebase Connected", "system"), 900);
  setTimeout(() => log("📡 Syncing Database Streams...", "system"), 1300);
  setTimeout(() => log("💬 Chat System Online", "system"), 1700);
  setTimeout(() => log("📢 Ads Engine Active", "system"), 2100);
  setTimeout(() => log("📰 Content Manager Ready", "system"), 2500);
  setTimeout(() => log("🚀 Control Center Fully Online", "system"), 3000);

  /* ================= LIVE SYSTEM ANALYSIS ================= */

  onSnapshot(collection(db, "posts"), () => {
    log("📌 Posts updated live", "system");
  });

  onSnapshot(collection(db, "adRequests"), () => {
    log("📢 Ad system activity detected", "system");
  });

  onSnapshot(collection(db, "featured"), () => {
    log("⭐ Featured content updated", "system");
  });

  onSnapshot(collection(db, "sponsored"), () => {
    log("💰 Sponsored slots updated", "system");
  });
}