import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let otherUid = new URLSearchParams(location.search).get("uid");

/* ================= AUTH ================= */
onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  me = u;

  setupUI();

  if (otherUid) {
    loadMessages();
  }
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= UI STATE ================= */
function setupUI() {
  const input = document.getElementById("msgInput");
  const btn = document.getElementById("sendBtn");
  const warn = document.getElementById("warn");

  if (!otherUid) {
    warn.innerText = "⚠️ Select a user to start chatting (DM mode required)";
    input.disabled = true;
    btn.disabled = true;
  } else {
    warn.innerText = "💬 Direct Message Active";
    input.disabled = false;
    btn.disabled = false;
  }
}

/* ================= LOAD ================= */
function loadMessages() {
  const id = chatId(me.uid, otherUid);

  const q = query(
    collection(db, "messages", id, "messages"),
    orderBy("time")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chat");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      const isMe = m.sender === me.uid;

      box.innerHTML += `
        <div class="msg ${isMe ? "me" : "other"}">
          <b>${isMe ? "You" : "User"}</b><br>
          ${m.text}
        </div>
      `;
    });

    // auto scroll like WhatsApp
    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND ================= */
window.sendMsg = async function () {
  if (!otherUid) return;

  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  const id = chatId(me.uid, otherUid);

  await addDoc(collection(db, "messages", id, "messages"), {
    text,
    sender: me.uid,
    time: serverTimestamp()
  });

  /* 🔔 notification */
  await addDoc(collection(db, "notifications", otherUid, "items"), {
    text: "New message received",
    seen: false,
    createdAt: serverTimestamp()
  });

  input.value = "";
};

/* ================= FRIEND REQUEST (FIXED BUG) ================= */
window.sendFriendRequest = async function (toUid, toName) {
  await addDoc(collection(db, "friendRequests"), {
    from: me.uid,   // ✅ FIXED (was user.uid)
    fromName: me.email.split("@")[0],
    to: toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, "notifications", toUid, "items"), {
    text: `${me.email.split("@")[0]} sent you a friend request`,
    seen: false,
    createdAt: serverTimestamp()
  });
};