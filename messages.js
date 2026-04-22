import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let activeChat = null;
let activeUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  me = u;

  loadChatList();
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= CHAT LIST (WHATSAPP STYLE) ================= */
function loadChatList() {
  const q = query(collection(db, "chats"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatList");
    box.innerHTML = "";

    snap.forEach(d => {
      const chat = d.data();

      if (!chat.members.includes(me.uid)) return;

      const other = chat.members.find(u => u !== me.uid);

      box.innerHTML += `
        <div class="chat-item" onclick="openChat('${other}')">
          <div class="chat-name">User ${other.substring(0,6)}</div>
          <div class="chat-last">${chat.lastMessage || ""}</div>
        </div>
      `;
    });
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function(uid) {
  activeUser = uid;
  activeChat = chatId(me.uid, uid);

  document.getElementById("activeUser").innerText = "Chat with " + uid.substring(0,6);

  document.getElementById("msgInput").disabled = false;
  document.getElementById("sendBtn").disabled = false;

  loadMessages();
  listenTyping(uid);
};

/* ================= LOAD MESSAGES ================= */
function loadMessages() {
  const q = query(
    collection(db, "chats", activeChat, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      const isMe = m.senderId === me.uid;

      box.innerHTML += `
        <div class="msg ${isMe ? "me" : "other"}">
          ${m.text}
          <div style="font-size:10px;opacity:0.6;">
            ${m.readBy?.length > 1 ? "✓✓" : "✓"}
          </div>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();

  if (!text || !activeChat) return;

  await addDoc(collection(db, "chats", activeChat, "messages"), {
    text,
    senderId: me.uid,
    createdAt: serverTimestamp(),
    readBy: [me.uid],
    delivered: true
  });

  await setDoc(doc(db, "chats", activeChat), {
    members: [me.uid, activeUser],
    lastMessage: text,
    lastUpdated: serverTimestamp()
  }, { merge: true });

  input.value = "";
  setTyping(false);
};

/* ================= TYPING ================= */
document.getElementById("msgInput").addEventListener("input", () => {
  setTyping(true);
  clearTimeout(window.typingTimer);

  window.typingTimer = setTimeout(() => {
    setTyping(false);
  }, 1000);
});

async function setTyping(state) {
  if (!activeUser) return;

  await setDoc(doc(db, "typing", me.uid), {
    chatId: activeChat,
    typing: state
  });
}

/* ================= LISTEN TYPING ================= */
function listenTyping(uid) {
  const ref = doc(db, "typing", uid);

  onSnapshot(ref, (snap) => {
    const data = snap.data();
    const el = document.getElementById("typing");

    if (data?.chatId === activeChat && data?.typing) {
      el.innerText = "typing...";
    } else {
      el.innerText = "";
    }
  });
}