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
  deleteDoc,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= MINI MONITOR ================= */
function log(msg) {
  const box = document.getElementById("profileMonitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  box.innerHTML += `[${time}] ${msg}<br>`;
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  log("User logged in");

  loadUsername();
  loadFriendRequests();
  loadFriends();
});

/* ================= MENU ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("dropdownMenu");
  if (!menu) return;

  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
};

/* ================= USERNAME ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  const el = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    el.innerText = snap.data().username;
  } else {
    el.innerText = "Not set";
  }

  log("Username loaded");
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

  log("Password reset requested");
};

/* ================= FRIEND SYSTEM (UNCHANGED) ================= */
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
          <b>${r.fromName}</b> sent a friend request

          <div style="margin-top:6px;">
            <button onclick="acceptFriend('${d.id}','${r.from}')">Accept</button>
            <button onclick="rejectFriend('${d.id}')">Reject</button>
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

function loadFriends() {
  const box = document.getElementById("friendsBox");
  if (!box) return;

  const q = query(collection(db, "friends"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const f = d.data();

      if (f.userA !== user.uid && f.userB !== user.uid) return;

      const friendId =
        f.userA === user.uid ? f.userB : f.userA;

      html += `
        <div class="card">
          👤 ${friendId}
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

/* ================= KEEP ORIGINAL FUNCTIONS ================= */
window.acceptFriend = async function (id, fromUid) {
  await updateDoc(doc(db, "friendRequests", id), {
    status: "accepted"
  });

  await addDoc(collection(db, "friends"), {
    userA: user.uid,
    userB: fromUid,
    createdAt: serverTimestamp()
  });

  log("Friend accepted");
};

window.rejectFriend = async function (id) {
  await updateDoc(doc(db, "friendRequests", id), {
    status: "rejected"
  });

  log("Friend rejected");
};

window.sendFriendRequest = async function (toUid, toName) {
  if (!user || user.uid === toUid) return;

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