import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  trackPresence();
  loadOnlineUsers();
});

/* ================= PRESENCE FIX ================= */
function trackPresence() {
  setInterval(async () => {
    await setDoc(doc(db, "presence", user.uid), {
      uid: user.uid,
      name: user.email.split("@")[0],
      lastSeen: Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, 5000);
}

/* ================= ONLINE USERS ================= */
function loadOnlineUsers() {
  onSnapshot(collection(db, "presence"), (snap) => {

    const now = Date.now();
    const users = [];

    snap.forEach(d => {
      const u = d.data();
      if (now - u.lastSeen < 10000) users.push(u);
    });

    render(users);
  });
}

/* ================= RENDER ================= */
function render(users) {
  const box = document.getElementById("onlineUsers");
  box.innerHTML = "";

  users.forEach(u => {
    if (u.uid === user.uid) return;

    const row = document.createElement("div");
    row.className = "user-row";

    row.innerHTML = `
      <div>${u.name}</div>
      <button onclick="openDM('${u.uid}')">Message</button>
    `;

    box.appendChild(row);
  });
}

/* ================= ACTION ================= */
window.openDM = (uid) => {
  location.href = "messages.html?uid=" + uid;
};