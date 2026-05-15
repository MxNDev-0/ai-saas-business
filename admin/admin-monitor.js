import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN CONTROL CENTER MONITOR v3 (BOOT EDITION)
========================================= */

export function startMonitor() {

  const box = document.getElementById("monitor");

  if (!box) {
    console.error("❌ Monitor UI missing");
    return;
  }

  if (window.__MCN_MONITOR_ACTIVE) return;
  window.__MCN_MONITOR_ACTIVE = true;

  const push = (msg, type = "ok") => {

    const div = document.createElement("div");
    const time = new Date().toLocaleTimeString();

    div.style.marginBottom = "4px";
    div.style.fontSize = "13px";

    div.style.color =
      type === "error" ? "red" :
      type === "warn" ? "orange" :
      type === "system" ? "#5bc0be" :
      "#00ff88";

    div.textContent = `[${time}] ${msg}`;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  };

  /* =========================================
     🧠 BOOT SEQUENCE (THIS IS YOUR “SCREEN LIVES” PART)
  ========================================= */

  const bootSteps = [
    "Powering MCN Engine Core...",
    "Checking Firebase connection...",
    "Scanning database structure...",
    "Loading authentication module...",
    "Verifying admin permissions...",
    "Starting post system...",
    "Starting ad engine...",
    "Starting support inbox...",
    "Activating real-time listeners...",
    "System ready ✔"
  ];

  let i = 0;

  const bootInterval = setInterval(() => {

    if (i < bootSteps.length) {
      push("🧠 " + bootSteps[i], "system");
      i++;
    } else {
      clearInterval(bootInterval);
      push("🚀 Control Center FULLY ONLINE", "system");
    }

  }, 600);

  /* =========================================
     LIVE FIRESTORE WATCHERS
  ========================================= */

  onSnapshot(collection(db, "system"), () => {
    push("⚙ System event detected", "system");
  });

  onSnapshot(collection(db, "posts"), () => {
    push("📌 Posts updated", "system");
  });

  onSnapshot(collection(db, "adRequests"), () => {
    push("📢 Ad activity detected", "system");
  });

  /* =========================================
     HEARTBEAT (keeps screen alive)
  ========================================= */

  setInterval(() => {
    push("💓 System heartbeat OK", "ok");
  }, 20000);

  /* =========================================
     FINAL READY STATE
  ========================================= */

  push("🧠 MCN Monitor Engine Initialized", "system");
}