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

/* ================= CREATE FLOAT BUTTON ================= */
const btn = document.createElement("div");
btn.id = "mcnChatBtn";
btn.innerHTML = "💬";
document.body.appendChild(btn);

/* ================= CREATE CHAT WINDOW ================= */
const box = document.createElement("div");
box.id = "mcnChatBox";

box.innerHTML = `
  <div id="mcnHeader">
    💬 Live Support
    <span id="mcnClose">✖</span>
  </div>

  <div id="mcnMessages"></div>

  <div id="mcnInputArea">
    <input id="mcnInput" placeholder="Type message..." />
    <button id="mcnSend">➤</button>
  </div>
`;

document.body.appendChild(box);

/* ================= STYLE (FIXED UX) ================= */
const style = document.createElement("style");

style.textContent = `
#mcnChatBtn{
  position:fixed;
  bottom:20px;
  right:20px;
  width:58px;
  height:58px;
  background:#5bc0be;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:22px;
  cursor:pointer;
  z-index:999999;
  box-shadow:0 6px 18px rgba(0,0,0,0.3);
}

#mcnChatBox{
  position:fixed;
  bottom:90px;
  right:20px;
  width:340px;
  height:460px;
  background:#1c2541;
  border-radius:14px;
  overflow:hidden;
  display:none;
  flex-direction:column;
  z-index:999999;
  font-family:Arial;
}

/* HEADER */
#mcnHeader{
  background:#5bc0be;
  color:#000;
  padding:10px;
  font-weight:bold;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

/* CLOSE */
#mcnClose{
  cursor:pointer;
  font-size:16px;
}

/* MESSAGES */
#mcnMessages{
  flex:1;
  padding:10px;
  overflow-y:auto;
  font-size:13px;
  color:white;
  display:flex;
  flex-direction:column;
  gap:8px;
}

.msg{
  max-width:75%;
  padding:10px;
  border-radius:10px;
  word-break:break-word;
  font-size:13px;
}

/* USER MESSAGE */
.me{
  align-self:flex-end;
  background:#5bc0be;
  color:#000;
  border-bottom-right-radius:4px;
}

/* SUPPORT MESSAGE */
.bot{
  align-self:flex-start;
  background:#0b132b;
  border:1px solid #2a2a2a;
  border-bottom-left-radius:4px;
}

/* INPUT AREA FIXED UX */
#mcnInputArea{
  display:flex;
  gap:8px;
  padding:8px;
  background:#141b2e;
}

/* SMALL INPUT */
#mcnInput{
  flex:1;
  padding:8px;
  border:none;
  border-radius:8px;
  outline:none;
  font-size:13px;
  background:#0b132b;
  color:white;
}

/* BIG SEND BUTTON */
#mcnSend{
  width:70px;
  border:none;
  border-radius:8px;
  background:#5bc0be;
  color:#000;
  font-weight:bold;
  cursor:pointer;
  font-size:14px;
}

#mcnSend:active{
  transform:scale(0.95);
}
`;

document.head.appendChild(style);

/* ================= TOGGLE UI ================= */
btn.onclick = () => {
  box.style.display = box.style.display === "flex" ? "none" : "flex";
};

document.addEventListener("click", (e) => {
  if (e.target.id === "mcnClose") {
    box.style.display = "none";
  }
});

/* ================= FIREBASE CHAT ================= */
const CHAT_ROOM = "global-support";

function getRef(uid) {
  return collection(db, "supportChats", uid, "messages");
}

/* SEND */
async function send(uid, text) {
  await addDoc(getRef(uid), {
    text,
    sender: "user",
    createdAt: serverTimestamp()
  });
}

/* LOAD */
function listen(uid) {
  const q = query(getRef(uid), orderBy("createdAt"));

  onSnapshot(q, (snap) => {
    const area = document.getElementById("mcnMessages");
    area.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

      const div = document.createElement("div");
      div.className = "msg " + (m.sender === "user" ? "me" : "bot");
      div.textContent = m.text;

      area.appendChild(div);
    });

    area.scrollTop = area.scrollHeight;
  });
}

/* ================= AUTH SAFE START ================= */
onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const input = document.getElementById("mcnInput");
  const sendBtn = document.getElementById("mcnSend");

  listen(user.uid);

  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    await send(user.uid, text);
    input.value = "";
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
});