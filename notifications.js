import { auth, db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let user = null;

onAuthStateChanged(auth, (u) => {
  if (!u) return;
  user = u;
  loadNotifications();
});

function loadNotifications() {
  const box = document.getElementById("notifBox");
  if (!box) return;

  const q = query(
    collection(db, "notifications", user.uid, "items"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const n = d.data();

      html += `
        <div style="padding:8px;margin:6px;background:#1c2541;border-radius:8px;">
          🔔 ${n.text}
        </div>
      `;
    });

    box.innerHTML = html;
  });
}