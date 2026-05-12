import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let chatId = null;
let targetUser = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) return location.href = "index.html";

  currentUser = user;

  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");

  loadInbox();

  if (uid) openChat(uid);

});

/* ================= USER RESOLVER (IMPORTANT FIX) ================= */

async function getUser(uid) {

  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    return {
      uid,
      username: "Unknown",
      photo: ""
    };
  }

  return snap.data();

}

/* ================= CHAT ID ================= */

function id(a, b) {
  return [a, b].sort().join("_");
}

/* ================= FALLBACK AVATAR ================= */

function avatar(name, photo) {
  if (photo) return photo;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5bc0be&color=000`;
}

/* ================= OPEN CHAT ================= */

window.openChat = async function(uid) {

  if (!uid) return;

  chatId = id(currentUser.uid, uid);
  targetUser = await getUser(uid);

  document.getElementById("chatUsername").textContent =
    targetUser.username;

  document.getElementById("chatAvatar").src =
    avatar(targetUser.username, targetUser.photo);

  document.getElementById("chatScreen").classList.add("active");

  loadMessages();

};

/* ================= SEND MESSAGE ================= */

window.sendMsg = async function() {

  const input = document.getElementById("msgInput");
  const text = input.value.trim();

  if (!text || !chatId) return;

  input.value = "";

  await addDoc(collection(db, "dms", chatId, "messages"), {
    text,
    senderId: currentUser.uid,
    receiverId: targetUser.uid,
    createdAt: serverTimestamp(),
    seen: false
  });

  await updateDoc(doc(db, "dms", chatId), {
    lastMessage: text,
    updatedAt: serverTimestamp(),
    [`unread.${targetUser.uid}`]: increment(1)
  });

};

/* ================= LOAD MESSAGES ================= */

function loadMessages() {

  const q = query(
    collection(db, "dms", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {

    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(d => {

      const m = d.data();

      const div = document.createElement("div");

      div.className =
        "msg " +
        (m.senderId === currentUser.uid ? "me" : "them");

      div.innerHTML = `
        ${m.text}
      `;

      box.appendChild(div);

      /* mark seen */
      if (m.senderId !== currentUser.uid && !m.seen) {
        updateDoc(doc(db, "dms", chatId, "messages", d.id), {
          seen: true
        });
      }

    });

    box.scrollTop = box.scrollHeight;

  });

}

/* ================= INBOX (FIXED USER SYNC) ================= */

function loadInbox() {

  const q = query(collection(db, "dms"));

  onSnapshot(q, async (snap) => {

    const list = document.getElementById("inboxList");
    list.innerHTML = "";

    for (const d of snap.docs) {

      const chat = d.data();

      if (!chat.members?.includes(currentUser.uid)) continue;

      const otherUid = chat.members.find(x => x !== currentUser.uid);
      const user = await getUser(otherUid);

      const div = document.createElement("div");

      div.className = "chat-item";

      div.innerHTML = `
        <div class="avatar-wrap">
          <img class="avatar" src="${avatar(user.username, user.photo)}">
        </div>

        <div class="chat-info">
          <div class="chat-name">${user.username}</div>
          <div class="chat-preview">${chat.lastMessage || "Start chat"}</div>
        </div>
      `;

      div.onclick = () => openChat(otherUid);

      list.appendChild(div);

    }

  });

}

/* ================= CLOSE CHAT ================= */

window.closeChat = function() {
  document.getElementById("chatScreen").classList.remove("active");
  chatId = null;
  targetUser = null;
};