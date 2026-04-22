import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let otherUid = null;
let typingTimeout = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";
  me = u;

  await setupPresence();
  loadUsers();
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= PRESENCE (REAL ONLINE SYSTEM) ================= */
async function setupPresence() {
  const userRef = doc(db, "users", me.uid);

  await setDoc(userRef, {
    online: true,
    lastSeen: serverTimestamp()
  }, { merge: true });

  onDisconnect(userRef).update({
    online: false,
    lastSeen: serverTimestamp()
  });
}

/* ================= USERS LIST ================= */
function loadUsers() {
  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("users");
    box.innerHTML = "";

    snap.forEach(d => {
      const user = d.data();
      const uid = d.id;

      if (uid === me.uid) return;

      box.innerHTML += `
        <div class="user" onclick="openChat('${uid}')">
          <span>${user.name || "User"}</span>
          <span class="online">${user.online ? "🟢" : "⚪"}</span>
        </div>
      `;
    });
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function(uid) {
  otherUid = uid;

  document.getElementById("msgInput").disabled = false;
  document.getElementById("sendBtn").disabled = false;

  loadMessages();
  listenTyping();
};

/* ================= CHAT LOADER ================= */
function loadMessages() {
  const id = chatId(me.uid, otherUid);

  const q = query(
    collection(db, "chats", id, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, async (snap) => {
    const box = document.getElementById("chat");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      const isMe = m.sender === me.uid;

      box.innerHTML += `
        <div class="msg ${isMe ? "me" : "other"}">
          ${m.text}<br>
          <small>
            ${m.readBy?.includes(me.uid) ? "✓✓" : "✓"}
          </small>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;

    /* mark messages as read */
    snap.forEach(async d => {
      const ref = doc(db, "chats", id, "messages", d.id);
      await updateDoc(ref, {
        readBy: arrayUnion(me.uid)
      });
    });
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !otherUid) return;

  const id = chatId(me.uid, otherUid);

  const msgRef = await addDoc(collection(db, "chats", id, "messages"), {
    text,
    sender: me.uid,
    createdAt: serverTimestamp(),
    readBy: [me.uid]
  });

  await setDoc(doc(db, "chats", id), {
    users: [me.uid, otherUid],
    lastMessage: text,
    updatedAt: serverTimestamp()
  }, { merge: true });

  input.value = "";
  setTyping(false);
};

/* ================= TYPING SYSTEM (CLEAN + DEBOUNCED) ================= */
document.getElementById("msgInput").addEventListener("input", () => {
  setTyping(true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    setTyping(false);
  }, 1500);
});

async function setTyping(state) {
  if (!otherUid) return;

  await setDoc(doc(db, "typing", me.uid), {
    to: otherUid,
    typing: state
  });
}

/* ================= LISTEN TYPING ================= */
function listenTyping() {
  const ref = doc(db, "typing", otherUid);

  onSnapshot(ref, (snap) => {
    const data = snap.data();
    const el = document.getElementById("typing");

    if (data?.to === me.uid && data?.typing) {
      el.innerText = "typing...";
    } else {
      el.innerText = "";
    }
  });
}

/* ================= AUTO OFFLINE ON TAB CLOSE ================= */
window.addEventListener("beforeunload", async () => {
  if (!me) return;

  await updateDoc(doc(db, "users", me.uid), {
    online: false,
    lastSeen: serverTimestamp()
  });
});