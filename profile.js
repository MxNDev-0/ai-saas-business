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
  doc,
  getDoc,
  getDocs,
  setDoc,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= MONITOR LOG ================= */
function log(msg, color = "#fff") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.innerHTML = `[${time}] ${msg}`;
  line.style.color = color;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  log("System booting...");
  log("User authenticated");

  loadUsername();
  loadNotifications();
  monitorAdRequests();
  loadChat();
  startCryptoMonitor();

  // 🔥 FRIEND SYSTEM
  loadAllUsers();
  loadFriendRequests();
  loadFriends();
});

/* ================= LOAD ALL USERS ================= */
function loadAllUsers() {
  const box = document.getElementById("friendRequestsBox");
  if (!box) return;

  onSnapshot(collection(db, "users"), (snap) => {
    box.innerHTML = "<h4>👥 Users</h4>";

    snap.forEach(docSnap => {
      const u = docSnap.data();
      const uid = docSnap.id;

      if (uid === user.uid) return;

      const div = document.createElement("div");
      div.style.marginBottom = "8px";

      div.innerHTML = `
        <b>${u.username || "User"}</b>
        <button onclick="sendFriendRequest('${uid}','${u.username || "User"}')">Add</button>
        <button onclick="startDM('${uid}')">Message</button>
      `;

      box.appendChild(div);
    });
  });
}

/* ================= SEND REQUEST ================= */
window.sendFriendRequest = async function (toUid, toName) {
  if (toUid === user.uid) return;

  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    fromName: user.email.split("@")[0],
    to: toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  log("Friend request sent");
};

/* ================= LOAD REQUESTS ================= */
function loadFriendRequests() {
  const box = document.getElementById("friendRequestsBox");
  if (!box) return;

  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", user.uid),
    where("status", "==", "pending")
  );

  onSnapshot(q, (snap) => {
    snap.forEach(docSnap => {
      const r = docSnap.data();

      const div = document.createElement("div");

      div.innerHTML = `
        <b>${r.fromName}</b>
        <button onclick="acceptRequest('${docSnap.id}','${r.from}','${r.fromName}')">Accept</button>
        <button onclick="rejectRequest('${docSnap.id}')">Reject</button>
      `;

      box.appendChild(div);
    });
  });
}

/* ================= ACCEPT ================= */
window.acceptRequest = async (id, fromUid, fromName) => {

  // add to friends (both users)
  await addDoc(collection(db, "friends"), {
    user1: user.uid,
    user2: fromUid,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "friendRequests", id), {
    status: "accepted"
  });

  log(`You are now friends with ${fromName}`);
};

/* ================= REJECT ================= */
window.rejectRequest = async (id) => {
  await updateDoc(doc(db, "friendRequests", id), {
    status: "rejected"
  });

  log("Friend request rejected");
};

/* ================= LOAD FRIENDS ================= */
function loadFriends() {
  const box = document.getElementById("friendsBox");
  if (!box) return;

  onSnapshot(collection(db, "friends"), async (snap) => {
    box.innerHTML = "";

    for (const d of snap.docs) {
      const f = d.data();

      let friendId = null;

      if (f.user1 === user.uid) friendId = f.user2;
      if (f.user2 === user.uid) friendId = f.user1;

      if (!friendId) continue;

      const userSnap = await getDoc(doc(db, "users", friendId));
      const name = userSnap.exists() ? userSnap.data().username : "User";

      const div = document.createElement("div");

      div.innerHTML = `
        <b>${name}</b>
        <button onclick="startDM('${friendId}')">Chat</button>
      `;

      box.appendChild(div);
    }
  });
}

/* ================= START DM ================= */
window.startDM = function (uid) {
  location.href = "messages.html?uid=" + uid;
};

/* ================= CHAT ================= */
function loadChat() {
  const q = query(collection(db, "chats"), orderBy("createdAt"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const m = change.doc.data();
        log(`💬 <b>${m.username}</b>: ${m.text}`, "#5bc0be");
      }
    });
  });
}

/* ================= CRYPTO ================= */
function startCryptoMonitor() {
  setInterval(async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      const data = await res.json();
      log(`BTC → $${data.bitcoin.usd}`, "#ccc");
    } catch {}
  }, 30000);
}

/* ================= USER ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  const el = document.getElementById("usernameDisplay");

  if (snap.exists()) {
    el.innerText = snap.data().username || "User";
  }
}

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent");
};

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  const ref = collection(db, "notifications", user.uid, "items");

  onSnapshot(query(ref, orderBy("createdAt", "desc")), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        log("🔔 New notification", "#ccc");
      }
    });
  });
}

/* ================= ADS ================= */
function monitorAdRequests() {
  const q = query(
    collection(db, "adRequests"),
    where("userId", "==", user.uid)
  );

  onSnapshot(q, (snap) => {
    snap.forEach(d => {
      const ad = d.data();

      if (ad.status === "approved") log("Ad approved", "#00ff88");
      if (ad.status === "rejected") log("Ad rejected", "#ff4d4d");
    });
  });
}