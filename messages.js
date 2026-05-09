import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN ENGINE DM SYSTEM V2
========================================= */

let currentUser = null;

let currentChatId = null;

let currentTargetUser = null;

let unsubscribeMessages = null;

let unsubscribeTyping = null;

/* ================= ELEMENTS ================= */

const chatBox =
  document.getElementById("chatBox");

const inboxList =
  document.getElementById("inboxList");

const msgInput =
  document.getElementById("msgInput");

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "index.html";

    return;
  }

  currentUser = user;

  loadInbox();

  const params =
    new URLSearchParams(location.search);

  const uid =
    params.get("uid");

  if (uid) {
    openChat(uid);
  }
});

/* ================= USER HELPERS ================= */

async function getUserData(uid) {

  try {

    const snap =
      await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {

      return {
        username: "Unknown User",
        avatar: ""
      };
    }

    return snap.data();

  } catch {

    return {
      username: "Unknown User",
      avatar: ""
    };
  }
}

/* ================= CHAT ID ================= */

function createChatId(uid1, uid2) {

  return [uid1, uid2]
    .sort()
    .join("_");
}

/* ================= OPEN CHAT ================= */

async function openChat(otherUid) {

  currentTargetUser = otherUid;

  currentChatId =
    createChatId(
      currentUser.uid,
      otherUid
    );

  inboxList.style.display = "none";

  const otherUser =
    await getUserData(otherUid);

  document.querySelector("h3").textContent =
    otherUser.username || "Messages";

  await ensureChatDocument(otherUid);

  loadMessages();

  listenTyping();

  markInboxRead();
}

/* ================= ENSURE CHAT ================= */

async function ensureChatDocument(otherUid) {

  const chatRef =
    doc(db, "dms", currentChatId);

  const snap =
    await getDoc(chatRef);

  if (!snap.exists()) {

    await setDoc(chatRef, {

      members: [
        currentUser.uid,
        otherUid
      ],

      createdAt: serverTimestamp(),

      lastMessage: "",

      lastMessageTime: serverTimestamp(),

      typing: {},

      unread: {
        [currentUser.uid]: 0,
        [otherUid]: 0
      }
    });
  }
}

/* ================= LOAD INBOX ================= */

async function loadInbox() {

  inboxList.innerHTML =
    `<div style="padding:10px;">
      Loading inbox...
    </div>`;

  const q =
    query(collection(db, "dms"));

  onSnapshot(q, async (snap) => {

    inboxList.innerHTML = "";

    let found = false;

    for (const d of snap.docs) {

      const data = d.data();

      if (
        !data.members ||
        !data.members.includes(currentUser.uid)
      ) continue;

      found = true;

      const otherUid =
        data.members.find(
          x => x !== currentUser.uid
        );

      const otherUser =
        await getUserData(otherUid);

      const unread =
        data.unread?.[currentUser.uid] || 0;

      const div =
        document.createElement("div");

      div.className = "item";

      div.innerHTML = `

        <div style="
          display:flex;
          align-items:center;
          gap:10px;
        ">

          <img
            src="${
              otherUser.photoURL ||
              otherUser.avatar ||
              'https://via.placeholder.com/40'
            }"
            style="
              width:40px;
              height:40px;
              border-radius:50%;
              object-fit:cover;
            "
          >

          <div style="flex:1;">

            <div style="
              font-weight:bold;
            ">
              ${
                otherUser.username ||
                otherUser.name ||
                "User"
              }
            </div>

            <div style="
              font-size:12px;
              opacity:0.7;
              margin-top:3px;
            ">
              ${
                data.lastMessage ||
                "No messages yet"
              }
            </div>

          </div>

          ${
            unread > 0
              ? `
                <div style="
                  min-width:22px;
                  height:22px;
                  background:#5bc0be;
                  color:#000;
                  border-radius:50%;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:11px;
                  font-weight:bold;
                ">
                  ${unread}
                </div>
              `
              : ""
          }

        </div>
      `;

      div.onclick = () =>
        openChat(otherUid);

      inboxList.appendChild(div);
    }

    if (!found) {

      inboxList.innerHTML = `
        <div style="
          padding:20px;
          text-align:center;
          opacity:0.7;
        ">
          No conversations yet
        </div>
      `;
    }
  });
}

/* ================= LOAD MESSAGES ================= */

function loadMessages() {

  if (unsubscribeMessages)
    unsubscribeMessages();

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

      for (const docSnap of snap.docs) {

        const m = docSnap.data();

        const isMe =
          m.senderId === currentUser.uid;

        const div =
          document.createElement("div");

        div.className =
          "msg " +
          (isMe ? "me" : "them");

        let status = "";

        if (isMe) {

          status =
            m.seen
              ? "✓✓ Seen"
              : "✓ Sent";
        }

        div.innerHTML = `

          ${
            m.type === "image"
              ? `
                <img
                  src="${m.fileUrl}"
                  style="
                    width:100%;
                    border-radius:10px;
                    margin-bottom:6px;
                  "
                >
              `
              : ""
          }

          ${
            m.text || ""
          }

          <div style="
            font-size:10px;
            opacity:0.7;
            margin-top:5px;
          ">
            ${status}
          </div>
        `;

        chatBox.appendChild(div);

        if (
          !isMe &&
          m.seen !== true
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

          } catch {}
        }
      }

      setTimeout(() => {
        chatBox.scrollTop =
          chatBox.scrollHeight;
      }, 50);
    });
}

/* ================= SEND MESSAGE ================= */

window.sendMsg = async function () {

  try {

    if (
      !msgInput.value.trim()
    ) return;

    if (
      !currentChatId
    ) return;

    const text =
      msgInput.value.trim();

    const me =
      await getUserData(currentUser.uid);

    await addDoc(
      collection(
        db,
        "dms",
        currentChatId,
        "messages"
      ),
      {

        text,

        type: "text",

        senderId:
          currentUser.uid,

        senderName:
          me.username || "User",

        senderPhoto:
          me.photoURL || "",

        createdAt:
          serverTimestamp(),

        seen: false
      }
    );

    await updateDoc(
      doc(db, "dms", currentChatId),
      {

        lastMessage: text,

        lastMessageTime:
          serverTimestamp(),

        [`unread.${currentTargetUser}`]:
          incrementSafe(1),

        [`typing.${currentUser.uid}`]:
          false
      }
    );

    msgInput.value = "";

  } catch (err) {

    console.error(err);

    alert("Send failed");
  }
};

/* ================= TYPING ================= */

msgInput.addEventListener(
  "input",
  async () => {

    if (!currentChatId) return;

    try {

      await updateDoc(
        doc(db, "dms", currentChatId),
        {
          [`typing.${currentUser.uid}`]:
            msgInput.value.length > 0
        }
      );

    } catch {}
  }
);

/* ================= LISTEN TYPING ================= */

function listenTyping() {

  if (unsubscribeTyping)
    unsubscribeTyping();

  unsubscribeTyping =
    onSnapshot(
      doc(db, "dms", currentChatId),
      (snap) => {

        if (!snap.exists()) return;

        const data =
          snap.data();

        const typing =
          data.typing?.[
            currentTargetUser
          ];

        let el =
          document.getElementById(
            "typingIndicator"
          );

        if (!el) {

          el =
            document.createElement("div");

          el.id =
            "typingIndicator";

          el.style.cssText = `
            padding:10px;
            font-size:12px;
            opacity:0.7;
          `;

          chatBox.parentNode.insertBefore(
            el,
            chatBox
          );
        }

        el.textContent =
          typing
            ? "Typing..."
            : "";
      }
    );
}

/* ================= READ RESET ================= */

async function markInboxRead() {

  try {

    await updateDoc(
      doc(db, "dms", currentChatId),
      {
        [`unread.${currentUser.uid}`]:
          0
      }
    );

  } catch {}
}

/* ================= SAFE INCREMENT ================= */

function incrementSafe(num) {

  return Number(num || 0);
}

/* ================= ENTER SEND ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    msgInput.addEventListener(
      "keypress",
      (e) => {

        if (e.key === "Enter") {
          sendMsg();
        }
      }
    );
  }
);

/* ================= DELETE CHAT ================= */

window.deleteChat = async function () {

  if (!currentChatId) return;

  const ok =
    confirm(
      "Delete this conversation?"
    );

  if (!ok) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "dms",
          currentChatId,
          "messages"
        )
      );

    for (const d of snap.docs) {

      await deleteDoc(
        doc(
          db,
          "dms",
          currentChatId,
          "messages",
          d.id
        )
      );
    }

    await deleteDoc(
      doc(db, "dms", currentChatId)
    );

    alert("Chat deleted");

    location.reload();

  } catch (err) {

    console.error(err);

    alert("Delete failed");
  }
};