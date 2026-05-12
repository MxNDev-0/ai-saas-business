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
  loadFeed();

});

/* ================= PROFILE INIT ================= */

async function ensureProfile(user) {

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {
      uid: user.uid,
      username: user.email.split("@")[0],
      bio: "MCN User",
      photo: "",
      coverPhoto: "",
      followers: [],
      following: [],
      privacy: "public",
      createdAt: Date.now()
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

  document.getElementById("followersCount").textContent =
    (profileData.followers || []).length;

  document.getElementById("followingCount").textContent =
    (profileData.following || []).length;

}

/* ================= CREATE POST (FIXED + PRIVACY) ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value.trim();
  if (!text) return;

  const postRef = collection(db, "userPosts", currentUser.uid, "posts");

  await addDoc(postRef, {
    uid: currentUser.uid,
    username: profileData.username,
    text,
    likes: 0,
    comments: [],
    createdAt: serverTimestamp()
  });

  document.getElementById("timelinePost").value = "";

};

/* ================= USER POSTS ================= */

function loadUserPosts(uid) {

  const q = query(collection(db, "userPosts", uid, "posts"));

  onSnapshot(q, (snap) => {

    const container = document.getElementById("timelinePosts");
    container.innerHTML = "";

    snap.forEach(d => {

      const p = d.data();

      container.innerHTML += `
        <div class="post-box">

          <b>${p.username}</b>
          <p>${p.text}</p>

          <div style="display:flex;gap:10px;margin-top:10px">

            <button onclick="likePost('${uid}','${d.id}',${p.likes})">
              ❤️ ${p.likes}
            </button>

            <button onclick="commentPost('${uid}','${d.id}')">
              💬 ${p.comments?.length || 0}
            </button>

            <button onclick="sharePost('${d.id}')">
              🔁 Share
            </button>

          </div>

        </div>
      `;

    });

  });

}

/* ================= LIKE ================= */

window.likePost = async function(uid, postId, likes) {

  const ref = doc(db, "userPosts", uid, "posts", postId);

  await updateDoc(ref, {
    likes: (likes || 0) + 1
  });

};

/* ================= COMMENT ================= */

window.commentPost = async function(uid, postId) {

  const text = prompt("Comment:");
  if (!text) return;

  const ref = doc(db, "userPosts", uid, "posts", postId);
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

/* ================= FEED (NEW GLOBAL SYSTEM) ================= */

function loadFeed() {

  const q = query(collection(db, "feed", "posts"));

  onSnapshot(q, (snap) => {

    const feedBox = document.getElementById("feedPosts");
    if (!feedBox) return;

    feedBox.innerHTML = "";

    snap.forEach(d => {

      const p = d.data();

      feedBox.innerHTML += `
        <div class="post-box">
          <b>${p.username}</b>
          <p>${p.text}</p>
        </div>
      `;

    });

  });

}

/* ================= SHARE FIX ================= */

window.sharePost = function(id) {

  const url = `${location.origin}/post.html?id=${id}`;

  if (navigator.share) {
    navigator.share({ title: "MCN Post", url });
  } else {
    navigator.clipboard.writeText(url);
    alert("Copied link");
  }

};

/* ================= SETTINGS SAFE ================= */

window.openSettings = function () {
  alert("V6 Settings coming soon (privacy system next)");
};

/* ================= NAV ================= */

window.goBack = () => history.length > 1 ? history.back() : location.href = "dashboard.html";

window.openInbox = () => location.href = "messages.html";

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};