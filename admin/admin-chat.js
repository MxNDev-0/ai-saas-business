import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ADMIN CHAT PANEL ================= */

const chatPanel = document.createElement("div");

chatPanel.id = "adminChatPanel";

chatPanel.innerHTML = `
  <div id="adminChatHeader">
    💬 Live Support
  </div>

  <div id="adminChatMessages"></div>

  <div id="adminChatInputBox">
    <input id="adminChatInput" placeholder="Reply to user..." />
    <button id="adminChatSend">Send</button>
  </div>
`;

document.body.appendChild(chatPanel);

/* ================= STYLE ================= */

const style = document.createElement("style");

style.innerHTML = `
#adminChatPanel{
  position:fixed;
  bottom:20px;
  left:20px;
  width:320px;
  height:420px;
  background:#1c2541;
  border-radius:14px;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  z-index:999999;
  font-family:Arial;
}

#adminChatHeader{
  background:#5bc0be;
  padding:10px;
  font-weight:bold;
  color:#000;
}

#adminChatMessages{
  flex:1;
  overflow-y:auto;
  padding:10px;
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:13px;
}

.adminMsg{
  background:#0b132b;
  padding:8px;
  border-radius:8px;
  color:white;
}

.userMsg{
  background:#5bc0be;
  color:black;
  align-self:flex-end;
}

#adminChatInputBox{
  display:flex;
  gap:6px;
  padding:8px;
  background:#141b2e;
}

#adminChatInput{
  flex:1;
  padding:8px;
  border:none;
  border-radius:8px;
  outline:none;
}

#adminChatSend{
  padding:8px 10px;
  background:#5bc0be;
  border:none;
  border-radius:8px;
  cursor:pointer;
}
`;

document.head.appendChild(style);

/* ================= FIREBASE CHAT ================= */

const CHAT_ID = "global";

const ref = collection(db, "supportChats", CHAT_ID, "messages");

const q = query(ref, orderBy("createdAt"));

onSnapshot(q, snap => {

  const box = document.getElementById("adminChatMessages");
  if (!box) return;

  box.innerHTML = "";

  snap.forEach(doc => {
    const m = doc.data();

    const div = document.createElement("div");
    div.className = "adminMsg " + (m.sender === "user" ? "userMsg" : "");
    div.textContent = m.text;

    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
});

/* ================= SEND ================= */

window.sendAdminReply = async function () {

  const input = document.getElementById("adminChatInput");

  const text = input.value.trim();
  if (!text) return;

  await addDoc(ref, {
    text,
    sender: "admin",
    createdAt: serverTimestamp()
  });

  input.value = "";
};

document.getElementById("adminChatSend").onclick =
  window.sendAdminReply;