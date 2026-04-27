import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= MONITOR LOG ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  box.innerHTML += `<br>[${time}] ${msg}`;
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  log("🟢 Profile loaded");

  loadUsername();
  loadFriendRequests();
  loadFriends();
  loadChatMonitor();
});

/* ================= USERNAME ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  const el = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    el.innerText = snap.data().username;
  } else {
    el.innerText = "Not set";
  }
}

/* ================= UPDATE USERNAME ================= */
window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return alert("Enter username");

  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });

  document.getElementById("usernameDisplay").innerText = username;
  input.value = "";

  log("Username updated");
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent");
  log("Password reset sent");
};

/* ================= 🔥 CHAT SYSTEM (MONITOR CORE) ================= */

const chatRef = collection(db, "chats", "global", "messages");

/* SEND MESSAGE */
window.sendChat = async () => {
  const input = document.getElementById("chatInput");
  if (!input || !input.value.trim()) return;

  try {
    await addDoc(chatRef, {
      text: input.value,
      uid: user.uid,
      username: user.email.split("@")[0],
      createdAt: serverTimestamp()
    });

    input.value = "";

  } catch (err) {
    console.error(err);
  }
};

/* LOAD CHAT INTO MONITOR */
function loadChatMonitor() {
  const box = document.getElementById("monitor");
  if (!box) return;

  onSnapshot(query(chatRef, orderBy("createdAt")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      const line = document.createElement("div");
      line.innerHTML = `
        💬 <b onclick="openUser('${m.uid}','${m.username}')"
             style="color:#5bc0be; cursor:pointer;">
          ${m.username}
        </b>: ${m.text}
      `;

      box.appendChild(line);
    });

    box.scrollTop = box.scrollHeight;
  });
}

loadChatMonitor();

/* USER CLICK (DM HOOK) */
window.openUser = (uid, name) => {
  log("Selected user: " + name);
  // future: open DM popup
};

/* ================= ACTIVATE CHAT INPUT ================= */
window.enableChat = () => {
  const input = document.getElementById("chatInput");
  const btn = document.getElementById("sendBtn");

  if (input) input.style.display = "block";
  if (btn) btn.style.display = "block";

  input.focus();
};

/* ================= FRIEND SYSTEM ================= */
window.sendFriendRequest = async function (toUid, toName) {
  if (!user || user.uid === toUid) return;

  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    to: toUid,
    status: "pending",
    createdAt: serverTimestamp()
  });

  log("Friend request sent");
};

/* ================= FRIEND LIST ================= */
function loadFriends() {
  const box = document.getElementById("friendsBox");
  if (!box) return;

  onSnapshot(collection(db, "friends"), (snap) => {
    let html = "";

    snap.forEach(d => {
      const f = d.data();

      if (f.userA !== user.uid && f.userB !== user.uid) return;

      const friendId = f.userA === user.uid ? f.userB : f.userA;

      html += `
        <div class="card">
          👤 ${friendId}
          <button onclick="openUser('${friendId}','Friend')">DM</button>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

/* ================= FRIEND REQUESTS ================= */
function loadFriendRequests() {
  const box = document.getElementById("friendRequestsBox");
  if (!box) return;

  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", user.uid),
    where("status", "==", "pending")
  );

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const r = d.data();

      html += `
        <div class="card">
          <b>${r.from}</b> sent request
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

/* ================= NAV ================= */
window.openProfile = function (uid) {
  location.href = `user.html?uid=${uid}`;
};