import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let currentChat = null;

/* AUTH */
onAuthStateChanged(auth, (u) => {
  if (!u) return location.href = "index.html";
  user = u;

  loadChats();
});

/* LOAD CHAT LIST */
async function loadChats() {
  const box = document.getElementById("chatList");

  const snap = await getDocs(collection(db, "users"));

  box.innerHTML = "";

  snap.forEach(d => {
    const u = d.data();
    const uid = d.id;

    if (uid === user.uid) return;

    box.innerHTML += `
      <div class="chat-item" onclick="openChat('${uid}', '${u.username}')">
        ${u.username}
      </div>
    `;
  });
}

/* OPEN CHAT */
window.openChat = function (uid, name) {
  currentChat = [user.uid, uid].sort().join("_");

  const box = document.getElementById("chatBox");

  const q = query(
    collection(db, "messages", currentChat, "messages"),
    orderBy("time", "asc")
  );

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      const isMe = m.sender === user.uid;

      box.innerHTML += `
        <div style="
          text-align:${isMe ? "right" : "left"};
          margin:5px;
        ">
          <span style="
            background:${isMe ? "#5bc0be" : "#0b132b"};
            padding:6px 10px;
            border-radius:10px;
            display:inline-block;
          ">
            ${m.text}
          </span>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
};

/* SEND */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();

  if (!text || !currentChat) return;

  await addDoc(
    collection(db, "messages", currentChat, "messages"),
    {
      text,
      sender: user.uid,
      time: serverTimestamp()
    }
  );

  input.value = "";
};