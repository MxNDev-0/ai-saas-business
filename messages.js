import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {

  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,

  collection,

  addDoc,

  query,
  orderBy,
  where,
  limit,

  onSnapshot,

  serverTimestamp,

  getDocs,

  increment

} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;

let currentChatId = null;

let currentTargetUser = null;

let unsubscribeMessages = null;

let unsubscribeTyping = null;

let typingTimeout = null;

/* ================= DOM ================= */

const inboxList =
document.getElementById("inboxList");

const chatScreen =
document.getElementById("chatScreen");

const chatBox =
document.getElementById("chatBox");

const msgInput =
document.getElementById("msgInput");

const searchInput =
document.getElementById("searchInput");

const typingIndicator =
document.getElementById("typingIndicator");

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "index.html";

    return;
  }

  currentUser = user;

  loadInbox();

  setupSearch();

  setupTypingSystem();

  const params =
  new URLSearchParams(location.search);

  const uid =
  params.get("uid");

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

window.openChat =
async function(uid) {

  if (uid === currentUser.uid) {
    return;
  }

  currentTargetUser = uid;

  currentChatId =
  createChatId(
    currentUser.uid,
    uid
  );

  chatScreen.classList.add("active");

  const userSnap =
  await getDoc(
    doc(db, "users", uid)
  );

  if (userSnap.exists()) {

    const u =
    userSnap.data();

    document.getElementById(
      "chatUsername"
    ).textContent =
      u.username || "User";

    document.getElementById(
      "chatAvatar"
    ).src =
      u.photo ||
      "https://via.placeholder.com/100";
  }

  await createChatIfMissing(uid);

  loadMessages();

  resetUnread();

  monitorTyping();
};

/* ================= CLOSE CHAT ================= */

window.closeChat =
function() {

  chatScreen.classList.remove(
    "active"
  );

  currentChatId = null;

  currentTargetUser = null;

  typingIndicator.textContent = "";

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  if (unsubscribeTyping) {
    unsubscribeTyping();
  }
};

/* ================= CREATE CHAT ================= */

async function createChatIfMissing(uid) {

  const ref =
  doc(db, "dms", currentChatId);

  const snap =
  await getDoc(ref);

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

      typing: "",

      unread: {}
    });
  }
}

/* ================= LOAD INBOX ================= */

function loadInbox() {

  const q = query(
    collection(db, "dms"),
    where(
      "members",
      "array-contains",
      currentUser.uid
    )
  );

  onSnapshot(
    q,
    async (snap) => {

      inboxList.innerHTML = "";

      const chats = [];

      snap.forEach((docSnap) => {

        const data =
        docSnap.data();

        chats.push({
          id: docSnap.id,
          ...data
        });

      });

      chats.sort((a, b) => {

        const at =
        a.updatedAt?.seconds || 0;

        const bt =
        b.updatedAt?.seconds || 0;

        return bt - at;
      });

      if (!chats.length) {

        inboxList.innerHTML = `

          <div
            style="
              padding:30px;
              text-align:center;
              opacity:.6;
            "
          >
            No conversations yet
          </div>
        `;

        return;
      }

      for (const chat of chats) {

        const other =
        chat.members.find(
          x => x !== currentUser.uid
        );

        const userSnap =
        await getDoc(
          doc(db, "users", other)
        );

        if (!userSnap.exists()) {
          continue;
        }

        const u =
        userSnap.data();

        const unread =
        chat.unread?.[
          currentUser.uid
        ] || 0;

        const div =
        document.createElement("div");

        div.className =
        "chat-item";

        div.innerHTML = `

          <div class="avatar-wrap">

            <img
              class="avatar"
              src="${
                u.photo ||
                "https://via.placeholder.com/100"
              }"
            >

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
    orderBy(
      "createdAt",
      "asc"
    ),
    limit(100)
  );

  unsubscribeMessages =
  onSnapshot(q, (snap) => {

    chatBox.innerHTML = "";

    snap.forEach((docSnap) => {

      const m =
      docSnap.data();

      const div =
      document.createElement("div");

      div.className =
      "msg " +
      (
        m.senderId === currentUser.uid
        ? "me"
        : "them"
      );

      const time =
      m.createdAt?.seconds
      ? new Date(
          m.createdAt.seconds * 1000
        ).toLocaleTimeString([],{
          hour:"2-digit",
          minute:"2-digit"
        })
      : "";

      div.innerHTML = `

        ${m.text}

        <div class="meta">

          ${time}

          ${
            m.senderId === currentUser.uid
            ? `
              •
              ${
                m.seen
                ? "Seen"
                : "Sent"
              }
            `
            : ""
          }

        </div>
      `;

      chatBox.appendChild(div);

      if (

        m.senderId !== currentUser.uid &&
        !m.seen

      ) {

        updateDoc(

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

        ).catch(()=>{});
      }

    });

    setTimeout(() => {

      chatBox.scrollTop =
      chatBox.scrollHeight;

    }, 50);

  });
}

/* ================= SEND ================= */

window.sendMsg =
async function() {

  const text =
  msgInput.value.trim();

  if (!text) return;

  if (!currentChatId) return;

  msgInput.value = "";

  await addDoc(

    collection(
      db,
      "dms",
      currentChatId,
      "messages"
    ),

    {

      text,

      senderId:
      currentUser.uid,

      receiverId:
      currentTargetUser,

      seen:false,

      createdAt:
      serverTimestamp()
    }

  );

  await updateDoc(

    doc(db, "dms", currentChatId),

    {

      lastMessage:text,

      lastSender:
      currentUser.uid,

      updatedAt:
      serverTimestamp(),

      typing:"",

      [`unread.${currentTargetUser}`]:
      increment(1)

    }

  );
};

/* ================= SEARCH ================= */

function setupSearch() {

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
}

/* ================= TYPING ================= */

function setupTypingSystem() {

  msgInput.addEventListener(
    "input",
    async () => {

      if (!currentChatId) return;

      await updateDoc(

        doc(
          db,
          "dms",
          currentChatId
        ),

        {
          typing:
          currentUser.uid
        }

      );

      clearTimeout(
        typingTimeout
      );

      typingTimeout =
      setTimeout(async () => {

        try {

          await updateDoc(

            doc(
              db,
              "dms",
              currentChatId
            ),

            {
              typing:""
            }

          );

        } catch(e){}

      }, 1500);

    }
  );
}

/* ================= MONITOR TYPING ================= */

function monitorTyping() {

  if (unsubscribeTyping) {
    unsubscribeTyping();
  }

  unsubscribeTyping =
  onSnapshot(

    doc(
      db,
      "dms",
      currentChatId
    ),

    async (snap) => {

      if (!snap.exists()) {
        return;
      }

      const data =
      snap.data();

      if (
        data.typing &&
        data.typing !== currentUser.uid
      ) {

        const userSnap =
        await getDoc(
          doc(
            db,
            "users",
            data.typing
          )
        );

        if (userSnap.exists()) {

          typingIndicator.textContent =
          `${
            userSnap.data().username ||
            "Someone"
          } is typing...`;
        }

      } else {

        typingIndicator.textContent =
        "";
      }

    }
  );
}

/* ================= RESET UNREAD ================= */

async function resetUnread() {

  try {

    await updateDoc(

      doc(
        db,
        "dms",
        currentChatId
      ),

      {
        [`unread.${currentUser.uid}`]:
        0
      }

    );

  } catch(e){}
}

/* ================= COMING SOON ================= */

window.pickFile =
function() {

  alert("Photo upload coming soon");
};

document.getElementById(
  "voiceBtn"
).onclick =
function() {

  alert("Voice messages coming soon");
};

window.startCall =
function() {

  alert(
    "MCN Voice & Video calls coming soon"
  );
};

/* ================= DELETE ================= */

window.deleteChat =
async function() {

  if (!currentChatId) return;

  const yes =
  confirm(
    "Delete chat?"
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

  await Promise.all(
    promises
  );

  await deleteDoc(
    doc(db, "dms", currentChatId)
  );

  closeChat();
};

/* ================= ENTER SEND ================= */

msgInput.addEventListener(
  "keypress",
  (e) => {

    if (
      e.key === "Enter"
    ) {

      sendMsg();
    }

  }
);