import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;
let viewingUid = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) return location.href = "index.html";

  currentUser = user;

  const params = new URLSearchParams(location.search);
  viewingUid = params.get("uid") || user.uid;

  await ensureProfile(user);

  loadProfile(viewingUid);
  loadUserPosts(viewingUid);
  loadOnlineUsers();

  setInterval(() => {
    updateDoc(doc(db, "users", currentUser.uid), {
      lastActive: Date.now()
    });
  }, 25000);

});

/* ================= PROFILE INIT ================= */

async function ensureProfile(user) {

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      username: user.email.split("@")[0],
      bio: "MCN Engine User",
      photo: "",
      coverPhoto: "",
      followers: [],
      following: [],
      createdAt: Date.now(),
      lastActive: Date.now()
    });
  }
}

/* ================= LOAD PROFILE ================= */

async function loadProfile(uid) {

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;

  profileData = snap.data();

  document.getElementById("username").textContent = profileData.username;
  document.getElementById("topUsername").textContent = profileData.username;
  document.getElementById("bio").textContent = profileData.bio || "";

  document.getElementById("postsCount").textContent = profileData.posts || 0;
  document.getElementById("followersCount").textContent = (profileData.followers || []).length;
  document.getElementById("followingCount").textContent = (profileData.following || []).length;
}

/* ================= USER POSTS (FIXED SCOPE) ================= */

function loadUserPosts(uid) {

  const q = query(collection(db, "timeline", uid, "posts"));

  onSnapshot(q, (snap) => {

    const container = document.getElementById("timelinePosts");
    container.innerHTML = "";

    snap.forEach(docSnap => {

      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="post-box">

          <b>${p.username}</b>
          <p>${p.text}</p>

          <div style="display:flex;gap:10px;margin-top:10px;">

            <button onclick="likePost('${uid}','${id}')">
              ❤️ ${p.likes || 0}
            </button>

            <button onclick="commentPost('${uid}','${id}')">
              💬 ${(p.comments || []).length}
            </button>

            <button onclick="sharePost('${id}')">
              🔁 Share
            </button>

          </div>

          <div style="margin-top:10px;font-size:13px;">
            ${(p.comments || []).slice(-3).map(c =>
              `<div>💬 ${c.username}: ${c.text}</div>`
            ).join("")}
          </div>

        </div>
      `;

    });

  });

}

/* ================= CREATE POST (FIXED) ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value.trim();
  if (!text) return;

  const ref = collection(db, "timeline", currentUser.uid, "posts");

  await addDoc(ref, {
    text,
    uid: currentUser.uid,
    username: profileData.username,
    likes: 0,
    comments: [],
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    posts: increment(1)
  });

  document.getElementById("timelinePost").value = "";

};

/* ================= LIKE ================= */

window.likePost = async function(uid, postId) {

  const ref = doc(db, "timeline", uid, "posts", postId);
  const snap = await getDoc(ref);

  let likes = snap.data().likes || 0;

  await updateDoc(ref, {
    likes: likes + 1
  });

};

/* ================= COMMENT ================= */

window.commentPost = async function(uid, postId) {

  const text = prompt("Comment:");
  if (!text) return;

  const ref = doc(db, "timeline", uid, "posts", postId);
  const snap = await getDoc(ref);

  let comments = snap.data().comments || [];

  comments.push({
    uid: currentUser.uid,
    username: profileData.username,
    text,
    time: Date.now()
  });

  await updateDoc(ref, { comments });

};

/* ================= SHARE FIX (NO 404) ================= */

window.sharePost = function(id) {

  const url = `${location.origin}/post.html?id=${id}`;

  if (navigator.share) {
    navigator.share({ title: "MCN Post", url });
  } else {
    navigator.clipboard.writeText(url);
    alert("Copied!");
  }

};

/* ================= SETTINGS ================= */

window.openSettings = function () {
  alert("Settings coming soon (safe stub)");
};

window.uploadAvatar = function () {
  alert("Avatar upload coming soon");
};

window.uploadCover = function () {
  alert("Cover upload coming soon");
};

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {

    const box = document.getElementById("onlineUsers");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {

      const u = d.data();
      if (u.uid === currentUser.uid) return;

      box.innerHTML += `
        <div onclick="openUserProfile('${u.uid}')">
          ${u.username}
        </div>
      `;

    });

  });

}

/* ================= NAV ================= */

window.goBack = () => {
  history.length > 1 ? history.back() : location.href = "dashboard.html";
};

window.openInbox = () => location.href = "messages.html";

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};