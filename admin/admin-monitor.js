import { db } from "../firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN CONTROL CENTER MONITOR v2
========================================= */

export function startMonitor() {

  const box = document.getElementById("monitor");

  if (!box) {
    console.error("❌ Monitor UI missing");
    return;
  }

  // Prevent double-init
  if (window.__MCN_MONITOR_ACTIVE) return;
  window.__MCN_MONITOR_ACTIVE = true;

  const push = (msg, type = "ok") => {

    const time = new Date().toLocaleTimeString();

    const div = document.createElement("div");

    div.style.marginBottom = "4px";
    div.style.fontSize = "13px";

    if (type === "error") div.style.color = "red";
    else if (type === "warn") div.style.color = "orange";
    else if (type === "system") div.style.color = "#5bc0be";
    else div.style.color = "#00ff88";

    div.textContent = `[${time}] ${msg}`;

    box.appendChild(div);

    box.scrollTop = box.scrollHeight;
  };

  /* ================= SYSTEM STREAM ================= */

  onSnapshot(collection(db, "system"), () => {
    push("⚙ System updated", "system");
  });

  /* ================= POSTS STREAM ================= */

  onSnapshot(collection(db, "posts"), () => {
    push("📌 Posts changed", "system");
  });

  /* ================= ADS STREAM ================= */

  onSnapshot(collection(db, "adRequests"), () => {
    push("📢 Ad activity detected", "system");
  });

  /* ================= INITIAL BOOT ================= */

  push("🧠 Control Center Monitor Online", "system");
  push("🔥 Firebase Connected", "system");
  push("📡 Realtime Watchers Active", "system");
}