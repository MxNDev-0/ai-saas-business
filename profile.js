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
  deleteDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;
let viewingUid = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  const params = new URLSearchParams(location.search);
  viewingUid = params.get("uid") || user.uid;

  await ensureProfile(user);

  await loadProfile(viewingUid);

  loadTimeline();
  loadOnlineUsers();

  setInterval(async () => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        lastActive: Date.now()
      });
    } catch (e) {}
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
  document.getElementById("likesCount").textContent = profileData.likes || 0;

  const cover = document.getElementById("coverPhoto");

  cover.style.background = profileData.coverPhoto
    ? `url(${profileData.coverPhoto}) center/cover`
    : "linear-gradient(135deg,#5bc0be,#1c2541)";

  const avatar = document.getElementById("avatar");

  avatar.innerHTML = profileData.photo
    ? `<img src="${profileData.photo}">`
    : (profileData.username?.[0]?.toUpperCase() || "U");

}

/* ================= NAVIGATION ================= */

window.goBack = function () {
  window.history.length > 1
    ? window.history.back()
    : location.href = "dashboard.html";
};

window.openInbox = function () {
  location.href = "messages.html";
};

window.openUserProfile = function(uid) {
  if (!uid) return;
  location.href = "profile.html?uid=" + uid;
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

        <button onclick="document.getElementById('settingsModal').remove()" style="width:100%;padding:12px;">
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

  await loadProfile(currentUser.uid);
};

/* ================= FOLLOW SYSTEM ================= */

window.toggleFollow = async function(targetUid) {

  if (!targetUid || targetUid === currentUser.uid) return;

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

  await loadProfile(viewingUid);
};

/* ================= POST SYSTEM ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value.trim();
  if (!text) return alert("Write something first");

  await addDoc(collection(db, "timeline"), {
    uid: currentUser.uid,
    username: profileData.username,
    userPhoto: profileData.photo || "",
    text,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: Date.now()
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    posts: increment(1)
  });

  document.getElementById("timelinePost").value = "";
};

/* ================= LIKE ================= */

window.likePost = async function(postId) {

  const postRef = doc(db, "timeline", postId);
  const snap = await getDoc(postRef);

  let likes = snap.data().likes || [];

  if (likes.includes(currentUser.uid)) {
    likes = likes.filter(x => x !== currentUser.uid);
  } else {
    likes.push(currentUser.uid);
  }

  await updateDoc(postRef, { likes });
};

/* ================= COMMENT ================= */

window.commentPost = async function(postId) {

  const text = prompt("Write comment:");
  if (!text) return;

  await addDoc(collection(db, "timeline", postId, "comments"), {
    uid: currentUser.uid,
    username: profileData.username,
    text,
    time: Date.now()
  });

  await updateDoc(doc(db, "timeline", postId), {
    commentsCount: increment(1)
  });

};

/* ================= SHARE FIX (NO 404) ================= */

window.sharePost = function(postId) {

  const base = window.location.origin + window.location.pathname.replace("profile.html", "");

  const url = base + "post.html?id=" + postId;

  if (navigator.share) {
    navigator.share({ title: "MCN Post", url });
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied");
  }

};

/* ================= TIMELINE ================= */

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

          <b onclick="openUserProfile('${p.uid}')" style="cursor:pointer;">
            ${p.username}
          </b>

          <p>${p.text}</p>

          <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">

            <button onclick="likePost('${id}')">
              ❤️ ${p.likes?.length || 0}
            </button>

            <button onclick="commentPost('${id}')">
              💬 ${p.commentsCount || 0}
            </button>

            <button onclick="sharePost('${id}')">
              🔁 ${p.sharesCount || 0}
            </button>

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
        <div class="online-user" onclick="openUserProfile('${u.uid}')" style="cursor:pointer;">
          ${u.username}
        </div>
      `;

    });

  });

}