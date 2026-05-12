import { db } from "../firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function startMonitor() {

  const log = document.getElementById("monitor");
  if (!log) return;

  const push = (msg) => {
    const time = new Date().toLocaleTimeString();
    log.innerHTML += `[${time}] ${msg}<br>`;
    log.scrollTop = log.scrollHeight;
  };

  // Watch system changes
  onSnapshot(collection(db, "system"), () => {
    push("⚙ System change detected");
  });

  // Watch posts
  onSnapshot(collection(db, "posts"), () => {
    push("📌 Posts updated");
  });

  // Watch ads
  onSnapshot(collection(db, "adRequests"), () => {
    push("📢 Ad activity detected");
  });

  push("🟢 Monitor online");
}