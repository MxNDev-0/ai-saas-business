import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

/* SAFE INIT */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  // WAIT FOR DOM SAFETY
  setTimeout(() => {
    listenChat();
    listenUsers();
    listenPosts();
  }, 300);
});

/* ================= CHAT ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !currentUser) return;

  await addDoc(collection(db, "chat"), {
    name: currentUser.email.split("@")[0], // FIXED username display
    text,
    time: Date.now()
  });

  input.value = "";
};

/* REAL TIME CHAT (FIXED SAFE) */
function listenChat() {
  const q = query(collection(db, "chat"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `
        <div style="margin:5px 0;">
          <b>${m.name}</b>: ${m.text}
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= USERS ================= */
function listenUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      if (u.email) {
        const name = u.email.split("@")[0];
        box.innerHTML += `<div>🟢 ${name}</div>`;
      }
    });
  });
}

/* ================= POSTS ================= */
function listenPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div style="margin-bottom:10px;">
          <b>${p.user}</b>
          <p>${p.text}</p>
        </div>
      `;
    });
  });
}

/* ================= LOGOUT ================= */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};