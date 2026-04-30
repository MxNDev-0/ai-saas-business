import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* LOGGER */
function log(msg) {
  const monitor = document.getElementById("monitor");
  monitor.innerHTML += "<br>" + msg;
  monitor.scrollTop = monitor.scrollHeight;
}

/* AUTH */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  log("[AUTH] " + u.email);

  trackOnlineStatus();
  loadOnlineUsers();
});

/* ONLINE TRACK */
function trackOnlineStatus() {
  setInterval(async () => {
    await addDoc(collection(db, "presence"), {
      uid: user.uid,
      name: user.email.split("@")[0],
      lastSeen: Date.now()
    });

    log("[PING] active");

  }, 5000);
}

/* LOAD USERS */
function loadOnlineUsers() {
  onSnapshot(collection(db, "presence"), (snap) => {

    const users = [];
    const now = Date.now();

    snap.forEach(doc => {
      const data = doc.data();
      if (now - data.lastSeen < 10000) users.push(data);
    });

    log("[USERS] " + users.length + " online");

    renderOnlineUsers(users);
  });
}

/* RENDER USERS */
function renderOnlineUsers(users) {
  const box = document.getElementById("onlineUsers");
  box.innerHTML = "";

  users.forEach(u => {
    if (u.uid === user.uid) return;

    const row = document.createElement("div");
    row.className = "user-row";

    row.innerHTML = `
      <div class="user-left">
        <span class="dot"></span>
        <span>${u.name}</span>
      </div>
      <div>
        <button onclick="openDM('${u.uid}')">Msg</button>
      </div>
    `;

    box.appendChild(row);
  });
}

/* MONITOR INPUT */
window.sendMonitorMsg = function() {
  const input = document.getElementById("monitorInput");
  if (!input.value.trim()) return;

  log("[CMD] " + input.value);
  input.value = "";
};

/* ACTIONS */
window.openDM = function(uid) {
  location.href = "messages.html?uid=" + uid;
};