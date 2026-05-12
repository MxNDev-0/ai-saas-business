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
  loadTimeline();
  loadOnlineUsers();

  setInterval(async () => {
    await updateDoc(doc(db, "users", currentUser.uid), {
      lastActive: Date.now()
    });
  }, 20000);

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
      posts: 0,
      likes: 0,
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

/* ================= NAV FIX ================= */

window.goBack = function () {
  window.history.length > 1
    ? window.history.back()
    : location.href = "dashboard.html";
};

/* ================= SETTINGS ================= */

window.openSettings = function () {

  const old = document.getElementById("settingsModal");
  if (old) old.remove();

  const modal = document.createElement("div");

  modal.id = "settingsModal";

  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div style="background:#111b36;padding:20px;border-radius:16px;width:90%;max-width:350px;">

        <h3 style="margin-bottom:15px;">Settings</h3>

        <button onclick="editProfile()" style="width:100%;padding:12px;margin-bottom:10px;">
          Edit Profile
        </button>

        <button onclick="document.body.removeChild(document.getElementById('settingsModal'))" style="width:100%;padding:12px;">
          Close
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
};

/* ================= EDIT PROFILE ================= */

window.editProfile = async function () {

  const username = prompt("Username:", profileData.username);
  if (!username) return;

  const bio = prompt("Bio:", profileData.bio);
  if (!bio) return;

  await updateDoc(doc(db, "users", currentUser.uid), {
    username,
    bio
  });

  loadProfile(currentUser.uid);
};

/* ================= FOLLOW SYSTEM ================= */

window.toggleFollow = async function(targetUid) {

  const meRef = doc(db, "users", currentUser.uid);
  const themRef = doc(db, "users", targetUid);

  const meSnap = await getDoc(meRef);
  const themSnap = await getDoc(themRef);

  const me = meSnap.data();
  const them = themSnap.data();

  let myFollowing = me.following || [];
  let theirFollowers = them.followers || [];

  const isFollowing = myFollowing.includes(targetUid);

  if (isFollowing) {
    myFollowing = myFollowing.filter(x => x !== targetUid);
    theirFollowers = theirFollowers.filter(x => x !== currentUser.uid);
  } else {
    myFollowing.push(targetUid);
    theirFollowers.push(currentUser.uid);
  }

  await updateDoc(meRef, { following: myFollowing });
  await updateDoc(themRef, { followers: theirFollowers });

  loadProfile(viewingUid);
};

/* ================= SHARE FIX (NO 404) ================= */

window.sharePost = function(id) {

  const base = window.location.href.split("/profile.html")[0];

  const url = base + "/post.html?id=" + id;

  if (navigator.share) {

    navigator.share({
      title: "MCN Post",
      url
    });

  } else {

    navigator.clipboard.writeText(url);
    alert("Link copied");

  }
};

/* ================= CREATE POST (FIXED - MAIN ISSUE) ================= */

window.createTimelinePost = async function () {

  const input = document.getElementById("timelinePost");
  const text = input.value.trim();

  if (!text) return alert("Write something first");

  const postRef = doc(collection(db, "timeline"));

  await setDoc(postRef, {
    uid: currentUser.uid,
    username: profileData.username,
    userPhoto: profileData.photo || "",
    text,
    createdAt: Date.now(),
    likes: [],
    comments: [],
    shares: 0
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    posts: increment(1)
  });

  input.value = "";
};

/* ================= LIKE POST ================= */

window.likePost = async function(postId, likes = []) {

  const ref = doc(db, "timeline", postId);

  let updated = likes || [];

  if (updated.includes(currentUser.uid)) {
    updated = updated.filter(x => x !== currentUser.uid);
  } else {
    updated.push(currentUser.uid);
  }

  await updateDoc(ref, { likes: updated });
};

/* ================= COMMENT POST ================= */

window.commentPost = async function(postId, text) {

  if (!text) return;

  const ref = doc(db, "timeline", postId);
  const snap = await getDoc(ref);

  const data = snap.data();

  const comments = data.comments || [];

  comments.push({
    uid: currentUser.uid,
    username: profileData.username,
    text,
    time: Date.now()
  });

  await updateDoc(ref, { comments });
};

/* ================= LOAD TIMELINE ================= */

function loadTimeline() {

  const q = query(collection(db, "timeline"));

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

          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">

            <button onclick="likePost('${id}', ${JSON.stringify(p.likes || [])})">
              ❤️ ${p.likes?.length || 0}
            </button>

            <button onclick="commentPost('${id}', prompt('Write comment:'))">
              💬 ${p.comments?.length || 0}
            </button>

            <button onclick="sharePost('${id}')">
              🔁 ${p.shares || 0}
            </button>

          </div>

          <div style="margin-top:10px;font-size:13px;opacity:.8;">
            ${(p.comments || []).slice(-3).map(c =>
              `<div>💬 ${c.username}: ${c.text}</div>`
            ).join("")}
          </div>

        </div>
      `;

    });

  });
}

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {

    const box = document.getElementById("onlineUsers");
    box.innerHTML = "";

    snap.forEach(d => {

      const u = d.data();
      if (u.uid === currentUser.uid) return;

      box.innerHTML += `
        <div onclick="openUserProfile('${u.uid}')"
          style="padding:10px;background:#16213e;margin:5px;border-radius:10px;cursor:pointer;">
          ${u.username}
        </div>
      `;

    });

  });

}

/* ================= NAV ================= */

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};