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

/* ================= CHAT BOX ================= */

const chatBox = document.createElement("div");
chatBox.id = "mcnChatBox";

chatBox.innerHTML = `
  <div id="mcnChatHeader">
    💬 MCN Live Support
    <span id="mcnClose">✖</span>
  </div>

  <div id="mcnMessages"></div>

  <div id="mcnInputBox">
    <textarea id="mcnInput" placeholder="Type message..."></textarea>
    <button id="mcnSend" disabled>➤</button>
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
  width:58px;
  height:58px;
  background:linear-gradient(145deg,#5bc0be,#3aa7a5);
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
  cursor:pointer;
  z-index:999999;
  box-shadow:0 10px 25px rgba(0,0,0,0.4);
  transition:0.2s ease;
}

#mcnChatBtn:active{
  transform:scale(0.92);
}

#mcnChatBox{
  position:fixed;
  bottom:95px;
  right:20px;
  width:340px;
  height:460px;
  background:#1c2541;
  border-radius:16px;
  overflow:hidden;
  display:none;
  flex-direction:column;
  z-index:999999;
  font-family:Arial;
  box-shadow:0 15px 40px rgba(0,0,0,0.5);
}

/* HEADER */
#mcnChatHeader{
  background:linear-gradient(90deg,#5bc0be,#3aa7a5);
  color:#000;
  padding:12px;
  font-weight:bold;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:14px;
}

#mcnClose{
  cursor:pointer;
  font-size:16px;
}

/* MESSAGES */
#mcnMessages{
  flex:1;
  padding:12px;
  overflow-y:auto;
  font-size:13px;
  color:white;
  display:flex;
  flex-direction:column;
  gap:10px;
  background:#0b132b;
}

.msg{
  padding:10px 12px;
  border-radius:14px;
  max-width:75%;
  word-break:break-word;
  font-size:13px;
  line-height:1.4;
  animation:pop 0.15s ease;
}

@keyframes pop{
  from{transform:scale(0.95);opacity:0.5}
  to{transform:scale(1);opacity:1}
}

.me{
  background:#5bc0be;
  color:#000;
  align-self:flex-end;
  border-bottom-right-radius:4px;
}

.bot{
  background:#1a2238;
  border:1px solid #2a3550;
  align-self:flex-start;
  border-bottom-left-radius:4px;
}

/* INPUT */
#mcnInputBox{
  display:flex;
  padding:10px;
  gap:6px;
  background:#141b2e;
  align-items:flex-end;
  border-top:1px solid rgba(255,255,255,0.05);
}

#mcnInput{
  flex:1;
  min-height:40px;
  max-height:100px;
  resize:none;
  padding:10px 12px;
  border:none;
  border-radius:12px;
  outline:none;
  background:#0b132b;
  color:white;
  font-size:14px;
  line-height:1.4;
  overflow-y:auto;
}

#mcnSend{
  width:44px;
  height:44px;
  border:none;
  border-radius:12px;
  background:#2c3e57;
  color:#aaa;
  font-size:18px;
  cursor:not-allowed;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:0.2s ease;
}

#mcnSend.active{
  background:linear-gradient(145deg,#5bc0be,#3aa7a5);
  color:#000;
  cursor:pointer;
}

#mcnSend:active{
  transform:scale(0.92);
}
`;

document.head.appendChild(style);

/* ================= TOGGLE ================= */

floatBtn.onclick = () => {
  chatBox.style.display =
    chatBox.style.display === "flex" ? "none" : "flex";
};

document.getElementById("mcnClose").onclick = () => {
  chatBox.style.display = "none";
};

/* ================= FIREBASE CHAT ================= */

function getChatRef(uid) {
  return collection(db, "supportChats", uid, "messages");
}

async function sendMessage(uid, text) {
  await addDoc(getChatRef(uid), {
    text,
    sender: "user",
    createdAt: serverTimestamp()
  });
}

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

/* ================= AUTH + UX ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const input = document.getElementById("mcnInput");
  const sendBtn = document.getElementById("mcnSend");

  function updateBtn() {
    const hasText = input.value.trim().length > 0;

    sendBtn.disabled = !hasText;

    if (hasText) sendBtn.classList.add("active");
    else sendBtn.classList.remove("active");
  }

  input.addEventListener("input", updateBtn);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendBtn.click();
    }
  });

  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    await sendMessage(user.uid, text);

    input.value = "";
    updateBtn();

    input.focus();

    const box = document.getElementById("mcnMessages");
    box.scrollTop = box.scrollHeight;
  };

  loadMessages(user.uid);
});