import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= FLOAT BUTTON ================= */

const floatBtn = document.createElement("div");
floatBtn.id = "mcnChatBtn";
floatBtn.innerHTML = "💬";

document.body.appendChild(floatBtn);

/* ================= CHAT WINDOW ================= */

const chatBox = document.createElement("div");
chatBox.id = "mcnChatBox";

chatBox.innerHTML = `
  <div id="mcnChatHeader">
    💬 MCN Support
    <span id="mcnClose">✖</span>
  </div>

  <div id="mcnMessages"></div>

  <div id="mcnInputBox">
    <input id="mcnInput" placeholder="Type message..." />
    <button id="mcnSend">Send</button>
  </div>
`;

document.body.appendChild(chatBox);

/* ================= STYLE ================= */

const style = document.createElement("style");

style.innerHTML = `
#mcnChatBtn{
  position:fixed;
  bottom:20px;
  right:20px;
  width:55px;
  height:55px;
  background:#5bc0be;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:22px;
  cursor:pointer;
  z-index:99999;
  box-shadow:0 5px 15px rgba(0,0,0,0.3);
}

#mcnChatBox{
  position:fixed;
  bottom:90px;
  right:20px;
  width:320px;
  height:420px;
  background:#1c2541;
  border-radius:12px;
  overflow:hidden;
  display:none;
  flex-direction:column;
  z-index:99999;
  font-family:Arial;
}

#mcnChatHeader{
  background:#5bc0be;
  color:#000;
  padding:10px;
  font-weight:bold;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

#mcnClose{
  cursor:pointer;
}

#mcnMessages{
  flex:1;
  padding:10px;
  overflow-y:auto;
  font-size:13px;
  color:white;
}

.msg{
  margin-bottom:8px;
  padding:8px;
  border-radius:8px;
  max-width:80%;
}

.me{
  background:#5bc0be;
  color:#000;
  margin-left:auto;
}

.bot{
  background:#0b132b;
  border:1px solid #333;
}

#mcnInputBox{
  display:flex;
  padding:8px;
  gap:5px;
  background:#141b2e;
}

#mcnInput{
  flex:1;
  padding:8px;
  border:none;
  border-radius:6px;
  outline:none;
}

#mcnSend{
  padding:8px 10px;
  background:#5bc0be;
  border:none;
  border-radius:6px;
  cursor:pointer;
}
`;

document.head.appendChild(style);

/* ================= UI TOGGLE ================= */

floatBtn.onclick = () => {
  chatBox.style.display =
    chatBox.style.display === "flex" ? "none" : "flex";
};

document.getElementById("mcnClose").onclick = () => {
  chatBox.style.display = "none";
};

/* ================= FIREBASE CHAT ================= */

let userRef = null;

function getChatRef(uid) {
  return collection(db, "supportChats", uid, "messages");
}

/* SEND MESSAGE */
async function sendMessage(uid, text) {
  await addDoc(getChatRef(uid), {
    text,
    sender: "user",
    createdAt: serverTimestamp()
  });
}

/* LOAD MESSAGES */
function loadMessages(uid) {
  const q = query(getChatRef(uid), orderBy("createdAt"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("mcnMessages");
    box.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

      const div = document.createElement("div");
      div.className = "msg " + (m.sender === "user" ? "me" : "bot");
      div.textContent = m.text;

      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= AUTH INIT ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const input = document.getElementById("mcnInput");
  const sendBtn = document.getElementById("mcnSend");

  loadMessages(user.uid);

  sendBtn.onclick = () => {
    const text = input.value.trim();
    if (!text) return;

    sendMessage(user.uid, text);
    input.value = "";
  };
});