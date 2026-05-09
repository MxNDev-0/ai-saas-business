import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {

  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,

  collection,

  query,
  orderBy,

  onSnapshot,

  updateDoc,

  serverTimestamp,

  getDocs

} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;

let currentChatId = null;

let currentTargetUser = null;

let unsubscribeMessages = null;

let mediaRecorder = null;

let audioChunks = [];

let typingTimeout = null;

/* ================= DOM ================= */

const inboxScreen =
document.getElementById("inboxScreen");

const chatScreen =
document.getElementById("chatScreen");

const inboxList =
document.getElementById("inboxList");

const chatBox =
document.getElementById("chatBox");

const msgInput =
document.getElementById("msgInput");

const searchInput =
document.getElementById("searchInput");

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "index.html";

    return;
  }

  currentUser = user;

  loadInbox();

  setupTypingSystem();

  const params =
  new URLSearchParams(location.search);

  const uid = params.get("uid");

  if (uid) {
    openChat(uid);
  }

});

/* ================= CHAT ID ================= */

function createChatId(a, b) {

  return [a, b]
    .sort()
    .join("_");
}

/* ================= OPEN CHAT ================= */

window.openChat = async function(uid) {

  currentTargetUser = uid;

  currentChatId =
  createChatId(currentUser.uid, uid);

  inboxScreen.classList.add("hidden");

  chatScreen.classList.add("active");

  const userSnap =
  await getDoc(doc(db, "users", uid));

  if (userSnap.exists()) {

    const data = userSnap.data();

    document.getElementById(
      "chatUsername"
    ).textContent =
      data.username || "User";

    document.getElementById(
      "chatAvatar"
    ).src =
      data.avatar ||
      "https://via.placeholder.com/100";
  }

  await createInboxIfMissing(uid);

  loadMessages();

  markMessagesSeen();
};

/* ================= CLOSE CHAT ================= */

window.closeChat = function() {

  chatScreen.classList.remove("active");

  inboxScreen.classList.remove("hidden");

  currentTargetUser = null;

  currentChatId = null;

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }
};

/* ================= CREATE CHAT ================= */

async function createInboxIfMissing(uid) {

  const ref =
  doc(db, "dms", currentChatId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {

      members: [
        currentUser.uid,
        uid
      ],

      createdAt:
      serverTimestamp(),

      updatedAt:
      serverTimestamp(),

      lastMessage: "",

      lastSender: "",

      unread: {}
    });
  }
}

/* ================= LOAD INBOX ================= */

function loadInbox() {

  onSnapshot(
    collection(db, "dms"),
    async (snap) => {

      inboxList.innerHTML = "";

      const chats = [];

      snap.forEach((docSnap) => {

        const data = docSnap.data();

        if (
          !data.members ||
          !data.members.includes(currentUser.uid)
        ) return;

        chats.push({
          id: docSnap.id,
          ...data
        });
      });

      chats.sort((a, b) => {

        const aTime =
        a.updatedAt?.seconds || 0;

        const bTime =
        b.updatedAt?.seconds || 0;

        return bTime - aTime;
      });

      for (const chat of chats) {

        const other =
        chat.members.find(
          x => x !== currentUser.uid
        );

        const userSnap =
        await getDoc(
          doc(db, "users", other)
        );

        if (!userSnap.exists()) continue;

        const u = userSnap.data();

        const unread =
          chat.unread?.[currentUser.uid] || 0;

        const div =
        document.createElement("div");

        div.className = "chat-item";

        div.innerHTML = `

          <div class="avatar-wrap">

            <img
              class="avatar"
              src="${
                u.avatar ||
                "https://via.placeholder.com/100"
              }"
            >

            ${
              u.online
              ? `<div class="online"></div>`
              : ""
            }

          </div>

          <div class="chat-info">

            <div class="chat-name">
              ${u.username || "User"}
            </div>

            <div class="chat-preview">

              ${
                chat.lastMessage ||
                "Start chatting..."
              }

            </div>

          </div>

          <div class="chat-meta">

            <div class="time">

              ${
                chat.updatedAt?.seconds
                ? new Date(
                    chat.updatedAt.seconds * 1000
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : ""
              }

            </div>

            ${
              unread > 0
              ? `
                <div class="badge">
                  ${unread}
                </div>
              `
              : ""
            }

          </div>
        `;

        div.onclick =
        () => openChat(other);

        inboxList.appendChild(div);
      }
    }
  );
}

/* ================= LOAD MESSAGES ================= */

function loadMessages() {

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const q =
  query(
    collection(
      db,
      "dms",
      currentChatId,
      "messages"
    ),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages =
  onSnapshot(q, async (snap) => {

    chatBox.innerHTML = "";

    snap.forEach(async (docSnap) => {

      const m = docSnap.data();

      const div =
      document.createElement("div");

      div.className =
        "msg " +
        (
          m.senderId === currentUser.uid
          ? "me"
          : "them"
        );

      /* TEXT */
      if (m.type === "text") {

        div.innerHTML = `

          ${m.text}

          <div class="meta">

            ${
              m.seen
              ? "Seen"
              : "Sent"
            }

          </div>
        `;
      }

      /* IMAGE */
      else if (m.type === "image") {

        div.innerHTML = `

          <img src="${m.fileUrl}">

          <div class="meta">
            Photo
          </div>
        `;
      }

      /* VOICE */
      else if (m.type === "voice") {

        div.innerHTML = `

          <audio controls>
            <source src="${m.fileUrl}">
          </audio>

          <div class="meta">
            Voice message
          </div>
        `;
      }

      chatBox.appendChild(div);

      /* SEEN */
      if (
        m.senderId !== currentUser.uid &&
        !m.seen
      ) {

        try {

          await updateDoc(
            doc(
              db,
              "dms",
              currentChatId,
              "messages",
              docSnap.id
            ),
            {
              seen: true
            }
          );

        } catch(e) {}
      }

    });

    setTimeout(() => {

      chatBox.scrollTop =
      chatBox.scrollHeight;

    }, 50);

  });
}

/* ================= SEND MESSAGE ================= */

window.sendMsg = async function() {

  if (!msgInput.value.trim()) return;

  if (!currentChatId) return;

  const text =
  msgInput.value.trim();

  msgInput.value = "";

  await addDoc(
    collection(
      db,
      "dms",
      currentChatId,
      "messages"
    ),
    {

      type: "text",

      text,

      senderId:
      currentUser.uid,

      receiverId:
      currentTargetUser,

      seen: false,

      createdAt:
      serverTimestamp()
    }
  );

  await updateDoc(
    doc(db, "dms", currentChatId),
    {

      lastMessage: text,

      lastSender:
      currentUser.uid,

      updatedAt:
      serverTimestamp(),

      [`unread.${currentTargetUser}`]:
      incrementValue(1)
    }
  );

};

/* ================= INCREMENT ================= */

function incrementValue(n) {

  return {
    __op: "Increment",
    operand: n
  };
}

/* ================= SEEN ================= */

async function markMessagesSeen() {

  try {

    await updateDoc(
      doc(db, "dms", currentChatId),
      {
        [`unread.${currentUser.uid}`]: 0
      }
    );

  } catch(e) {}
}

/* ================= TYPING ================= */

function setupTypingSystem() {

  msgInput.addEventListener(
    "input",
    async () => {

      if (!currentChatId) return;

      await updateDoc(
        doc(db, "dms", currentChatId),
        {
          typing:
          currentUser.uid
        }
      );

      clearTimeout(typingTimeout);

      typingTimeout =
      setTimeout(async () => {

        try {

          await updateDoc(
            doc(db, "dms", currentChatId),
            {
              typing: ""
            }
          );

        } catch(e) {}

      }, 1500);
    }
  );
}

/* ================= FILE PICKER ================= */

window.pickFile = function() {

  document.getElementById(
    "fileInput"
  ).click();
};

document.getElementById(
  "fileInput"
).onchange = async (e) => {

  const file =
  e.target.files[0];

  if (!file) return;

  const form =
  new FormData();

  form.append("file", file);

  form.append(
    "upload_preset",
    "ml_default"
  );

  const res =
  await fetch(
    "https://api.cloudinary.com/v1_1/demo/upload",
    {
      method: "POST",
      body: form
    }
  );

  const data =
  await res.json();

  await addDoc(
    collection(
      db,
      "dms",
      currentChatId,
      "messages"
    ),
    {

      type: "image",

      fileUrl:
      data.secure_url,

      senderId:
      currentUser.uid,

      receiverId:
      currentTargetUser,

      createdAt:
      serverTimestamp()
    }
  );

  await updateDoc(
    doc(db, "dms", currentChatId),
    {

      lastMessage:
      "📷 Photo",

      updatedAt:
      serverTimestamp()
    }
  );
};

/* ================= VOICE ================= */

const voiceBtn =
document.getElementById("voiceBtn");

let recording = false;

voiceBtn.onclick =
async function() {

  if (!recording) {

    const stream =
    await navigator
    .mediaDevices
    .getUserMedia({
      audio: true
    });

    mediaRecorder =
    new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable =
    e => {

      audioChunks.push(e.data);
    };

    mediaRecorder.onstop =
    uploadVoice;

    mediaRecorder.start();

    recording = true;

    voiceBtn.innerHTML = "⏹";

  } else {

    mediaRecorder.stop();

    recording = false;

    voiceBtn.innerHTML = "🎤";
  }
};

async function uploadVoice() {

  const blob =
  new Blob(audioChunks, {
    type: "audio/webm"
  });

  const form =
  new FormData();

  form.append("file", blob);

  form.append(
    "upload_preset",
    "ml_default"
  );

  const res =
  await fetch(
    "https://api.cloudinary.com/v1_1/demo/upload",
    {
      method: "POST",
      body: form
    }
  );

  const data =
  await res.json();

  await addDoc(
    collection(
      db,
      "dms",
      currentChatId,
      "messages"
    ),
    {

      type: "voice",

      fileUrl:
      data.secure_url,

      senderId:
      currentUser.uid,

      receiverId:
      currentTargetUser,

      createdAt:
      serverTimestamp()
    }
  );

  await updateDoc(
    doc(db, "dms", currentChatId),
    {

      lastMessage:
      "🎤 Voice message",

      updatedAt:
      serverTimestamp()
    }
  );
}

/* ================= DELETE CHAT ================= */

window.deleteChat =
async function() {

  if (!currentChatId) return;

  const yes =
  confirm(
    "Delete this chat?"
  );

  if (!yes) return;

  const snap =
  await getDocs(
    collection(
      db,
      "dms",
      currentChatId,
      "messages"
    )
  );

  const promises = [];

  snap.forEach(d => {

    promises.push(
      deleteDoc(d.ref)
    );
  });

  await Promise.all(promises);

  closeChat();
};

/* ================= CALL ================= */

window.startCall =
function() {

  alert(
    "MCN Voice/Video system coming in future upgrade"
  );
};

/* ================= SEARCH ================= */

searchInput.addEventListener(
  "input",
  () => {

    const value =
    searchInput.value
      .toLowerCase();

    document
      .querySelectorAll(".chat-item")
      .forEach(el => {

        el.style.display =
          el.innerText
          .toLowerCase()
          .includes(value)
          ? "flex"
          : "none";
      });
  }
);

/* ================= ENTER SEND ================= */

msgInput.addEventListener(
  "keypress",
  (e) => {

    if (e.key === "Enter") {
      sendMsg();
    }
  }
);