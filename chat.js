import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const usersListDiv = document.getElementById("usersList");
const chatBox = document.getElementById("chatBox");
const chatHeader = document.getElementById("chatHeader");

let currentChatId = null;
let currentUser = null;

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  loadUsers();
});

// ================= NAV =================
window.logout = () => signOut(auth);
window.goBack = () => window.location.href = "dashboard.html";

// ================= LOAD USERS =================
async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  usersListDiv.innerHTML = "";

  snapshot.forEach(docSnap => {
    const user = docSnap.data();
    const uid = docSnap.id;

    if (uid === currentUser.uid) return;

    usersListDiv.innerHTML += `
      <div style="padding:8px; background:#0b132b; margin:5px 0; border-radius:5px; cursor:pointer;"
        onclick="openChat('${uid}', '${user.email}')">
        ${user.email}
      </div>
    `;
  });
}

// ================= OPEN CHAT =================
window.openChat = function (userId, email) {
  const myId = currentUser.uid;

  // create unique chat ID
  currentChatId = [myId, userId].sort().join("_");

  chatHeader.innerText = "Chat with " + email;

  loadMessages();
};

// ================= SEND MESSAGE =================
window.sendMessage = async function () {
  const input = document.getElementById("messageInput");
  const text = input.value;

  if (!text || !currentChatId) return;

  await addDoc(collection(db, "chats", currentChatId, "messages"), {
    text: text,
    sender: currentUser.uid,
    email: currentUser.email,
    time: Date.now()
  });

  input.value = "";
};

// ================= LOAD MESSAGES =================
function loadMessages() {
  const q = query(
    collection(db, "chats", currentChatId, "messages"),
    orderBy("time")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach(doc => {
      const msg = doc.data();

      const isMe = msg.sender === currentUser.uid;

      chatBox.innerHTML += `
        <div style="
          margin:5px 0;
          padding:8px;
          border-radius:5px;
          background:${isMe ? "#5bc0be" : "#0b132b"};
          text-align:${isMe ? "right" : "left"};
        ">
          <b>${msg.email}</b><br>
          ${msg.text}
        </div>
      `;
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
