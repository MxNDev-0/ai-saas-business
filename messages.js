import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let user = null;
let chatId = null;
let targetUser = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (u) => {

  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  loadInbox();

  const params = new URLSearchParams(location.search);

  if (params.get("uid")) {
    openChat(params.get("uid"));
  }
});

/* ================= CHAT ID ================= */

function makeChatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= OPEN CHAT ================= */

async function openChat(uid) {

  targetUser = uid;

  chatId = makeChatId(user.uid, uid);

  const snap = await getDoc(doc(db, "users", uid));

  document.getElementById("chatUsername").textContent =
    snap.exists() ? snap.data().username : "User";

  loadMessages();
}

/* ================= INBOX ================= */

function loadInbox() {

  onSnapshot(collection(db, "dms"), async (snap) => {

    const box = document.getElementById("inboxList");

    box.innerHTML = "";

    snap.forEach(async (d) => {

      const data = d.data();

      if (!data.members.includes(user.uid)) return;

      const other = data.members.find(x => x !== user.uid);

      const u = await getDoc(doc(db, "users", other));

      const name = u.exists() ? u.data().username : "User";

      const div = document.createElement("div");

      div.className = "item";

      div.textContent = name;

      div.onclick = () => openChat(other);

      box.appendChild(div);
    });

  });
}

/* ================= MESSAGES ================= */

function loadMessages() {

  onSnapshot(
    query(
      collection(db, "dms", chatId, "messages"),
      orderBy("createdAt")
    ),
    (snap) => {

      const box = document.getElementById("chatBox");

      box.innerHTML = "";

      snap.forEach(d => {

        const m = d.data();

        const div = document.createElement("div");

        div.className =
          "msg " +
          (m.senderId === user.uid ? "me" : "them");

        if (m.type === "image") {

          div.innerHTML = `
            <img src="${m.fileUrl}" style="width:100%;border-radius:10px;">
          `;

        } else if (m.type === "voice") {

          div.innerHTML = `
            <audio controls src="${m.fileUrl}"></audio>
          `;

        } else {

          div.textContent = m.text;
        }

        box.appendChild(div);
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ================= SEND ================= */

window.sendMsg = async function () {

  const input = document.getElementById("msgInput");

  if (!input.value.trim()) return;

  await addDoc(collection(db, "dms", chatId, "messages"), {

    text: input.value,

    senderId: user.uid,

    type: "text",

    createdAt: serverTimestamp()

  });

  input.value = "";
};

/* ================= IMAGE UPLOAD ================= */

window.pickFile = function () {
  document.getElementById("fileInput").click();
};

document.getElementById("fileInput").onchange = async (e) => {

  const file = e.target.files[0];

  if (!file) return;

  const form = new FormData();

  form.append("file", file);

  form.append("upload_preset", "ml_default");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/demo/upload",
    { method: "POST", body: form }
  );

  const data = await res.json();

  await addDoc(collection(db, "dms", chatId, "messages"), {

    fileUrl: data.secure_url,

    type: "image",

    senderId: user.uid,

    createdAt: serverTimestamp()

  });
};

/* ================= VOICE ================= */

let recorder;
let chunks = [];

window.startVoice = async function () {

  const stream =
    await navigator.mediaDevices.getUserMedia({ audio: true });

  recorder = new MediaRecorder(stream);

  recorder.start();

  recorder.ondataavailable = e => chunks.push(e.data);

  recorder.onstop = async () => {

    const blob = new Blob(chunks, { type: "audio/webm" });

    const form = new FormData();

    form.append("file", blob);

    form.append("upload_preset", "ml_default");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/demo/upload",
      { method: "POST", body: form }
    );

    const data = await res.json();

    await addDoc(collection(db, "dms", chatId, "messages"), {

      fileUrl: data.secure_url,

      type: "voice",

      senderId: user.uid,

      createdAt: serverTimestamp()

    });
  };
};

window.stopVoice = () => recorder.stop();

/* ================= CALL (FUTURE) ================= */

window.startCall = function () {
  alert("Call system coming in MCN Engine V18");
};