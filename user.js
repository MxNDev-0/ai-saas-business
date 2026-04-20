import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let targetUid = new URLSearchParams(location.search).get("uid");

onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  me = u;

  loadUserProfile();
  loadPosts();
  loadFriendState();
});

/* ================= LOAD USER PROFILE ================= */
async function loadUserProfile() {
  const snap = await getDoc(doc(db, "users", targetUid));

  if (snap.exists()) {
    document.getElementById("username").innerText =
      snap.data().username || "Unknown";
  }

  document.getElementById("uid").innerText = targetUid;
}

/* ================= LOAD POSTS ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), where("userId", "==", targetUid));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("posts");
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="post">
          <b>${p.user}</b>
          <div style="margin-top:6px;">${p.text}</div>
        </div>
      `;
    });
  });
}

/* ================= FRIEND SYSTEM STATE ================= */
async function loadFriendState() {
  const btn = document.getElementById("friendBtn");

  const q = query(collection(db, "friendRequests"));

  onSnapshot(q, (snap) => {
    let state = "none";

    snap.forEach(d => {
      const r = d.data();

      if (
        (r.from === me.uid && r.to === targetUid) ||
        (r.from === targetUid && r.to === me.uid)
      ) {
        state = r.status;
      }
    });

    if (state === "pending") btn.innerText = "Request Sent";
    else if (state === "accepted") btn.innerText = "Friends";
    else btn.innerText = "Add Friend";
  });
}

/* ================= TOGGLE FRIEND ================= */
window.toggleFriend = async function () {
  const ref = collection(db, "friendRequests");

  await addDoc(ref, {
    from: me.uid,
    to: targetUid,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Friend request sent");
};

/* ================= DM HOOK ================= */
window.openDM = function () {
  location.href = `messages.html?uid=${targetUid}`;
};