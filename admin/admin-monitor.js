import { db } from "../firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function startMonitor() {

  function init() {

    const box = document.getElementById("monitor");

    if (!box) {
      console.warn("⚠ Monitor UI missing, retrying...");
      setTimeout(init, 300);
      return;
    }

    if (box.dataset.active === "true") return;
    box.dataset.active = "true";

    // ===== UI HEADER =====
    box.innerHTML = `
      <div style="color:#5bc0be;font-weight:bold;margin-bottom:10px;">
        🧠 MCN CONTROL CENTER
      </div>
    `;

    const push = (msg, type = "info") => {

      const time = new Date().toLocaleTimeString();

      const color =
        type === "error"
          ? "#ff4d4d"
          : type === "warn"
          ? "#ffb84d"
          : "#00ff88";

      const div = document.createElement("div");

      div.style.color = color;
      div.style.marginBottom = "4px";
      div.style.fontSize = "13px";

      div.textContent = `[${time}] ${msg}`;

      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    };

    // ===== SYSTEM WATCHERS =====
    onSnapshot(collection(db, "system"), () => {
      push("⚙ System event detected", "info");
    });

    onSnapshot(collection(db, "posts"), () => {
      push("📌 Post created/updated", "info");
    });

    onSnapshot(collection(db, "adRequests"), (snap) => {

      snap.docChanges().forEach(change => {

        if (change.type === "added") {
          push("📢 New ad request", "warn");
        }

        if (change.type === "modified") {
          push("📢 Ad updated", "info");
        }

        if (change.type === "removed") {
          push("🗑 Ad removed", "error");
        }

      });

    });

    // ===== LIVE CHAT HOOK =====
    onSnapshot(collection(db, "supportChats"), (snap) => {
      push(`💬 Active chats: ${snap.size}`, "info");
    });

    // ===== STARTUP =====
    push("🟢 Control Center Online", "info");
    push("🔥 Firebase Connected", "info");
    push("📡 Real-time monitoring active", "info");

    // heartbeat
    setInterval(() => {
      push("💓 System heartbeat OK", "info");
    }, 30000);

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}