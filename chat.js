import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let activeChatUser = null;
let chatId = null;

/* ================= SEND MESSAGE ================= */
export async function sendChatMessage(text, userData) {
  if (!text.trim() || !auth.currentUser || !chatId) return;

  const msgRef = await addDoc(collection(db, "dms", chatId, "messages"), {
    text,
    from: auth.currentUser.uid,
    to: activeChatUser,
    read: false,
    delivered: true,
    createdAt: serverTimestamp()
  });

  // 🔥 conversation update (INBOX FIX)
  await setDoc(doc(db, "conversations", chatId), {
    participants: [auth.currentUser.uid, activeChatUser],
    lastMessage: text,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ================= LISTEN CHAT ================= */
export function listenChat(callback, chatIdParam) {
  const q = query(
    collection(db, "dms", chatIdParam, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, async (snap) => {
    const messages = [];

    snap.forEach(d => {
      messages.push({ id: d.id, ...d.data() });
    });

    callback(messages);
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function(uid) {
  activeChatUser = uid;
  chatId = [auth.currentUser.uid, uid].sort().join("_");

  document.getElementById("chatHeader").innerText = "Chatting with " + uid;

  listenMessages();
};

/* ================= LOAD MESSAGES ================= */
function listenMessages() {
  const box = document.getElementById("chatBox");

  const q = query(
    collection(db, "dms", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, async (snap) => {
    box.innerHTML = "";

    snap.forEach(async (docSnap) => {
      const m = docSnap.data();

      const div = document.createElement("div");
      div.className = "msg " + (m.from === auth.currentUser.uid ? "me" : "them");
      div.textContent = m.text;

      box.appendChild(div);

      // 🔥 READ RECEIPT
      if (m.to === auth.currentUser.uid && !m.read) {
        await updateDoc(doc(db, "dms", chatId, "messages", docSnap.id), {
          read: true
        });
      }
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE UI ================= */
window.sendMessage = async function () {
  const input = document.getElementById("messageInput");

  if (!input.value.trim()) return;

  await sendChatMessage(input.value.trim(), null);

  input.value = "";
};