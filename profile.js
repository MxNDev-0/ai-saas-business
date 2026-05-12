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
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;
let viewingUid = null;

/* ================= INIT ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) return (location.href = "index.html");

  currentUser = user;

  const params = new URLSearchParams(location.search);
  viewingUid = params.get("uid") || user.uid;

  await ensureProfile(user);

  loadProfile(viewingUid);
  loadTimeline(viewingUid);
  loadOnlineUsers();
});

/* ================= PROFILE CREATE ================= */

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

  const avatar = document.getElementById("avatar");

  if (profileData.photo) {
    avatar.innerHTML = `<img src="${profileData.photo}">`;
  } else {
    avatar.textContent = profileData.username?.[0]?.toUpperCase() || "U";
  }
}

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
    myFollowing = myFollowing.filter(id => id !== targetUid);
    theirFollowers = theirFollowers.filter(id => id !== currentUser.uid);
  } else {
    myFollowing.push(targetUid);
    theirFollowers.push(currentUser.uid);
  }

  await updateDoc(meRef, { following: myFollowing });
  await updateDoc(themRef, { followers: theirFollowers });

  loadProfile(targetUid);
};

/* ================= OPEN PROFILE ================= */

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};

/* ================= TIMELINE POSTS ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value.trim();
  if (!text) return;

  await addDoc(collection(db, "timeline"), {
    uid: currentUser.uid,
    username: profileData.username,
    userPhoto: profileData.photo || "",
    text,
    likes: [],
    comments: [],
    shares: 0,
    createdAt: Date.now()
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    posts: increment(1)
  });

  document.getElementById("timelinePost").value = "";
};

/* ================= LIKE ================= */

window.likePost = async function(postId, likes = []) {

  const ref = doc(db, "timeline", postId);

  let updated = likes || [];

  if (updated.includes(currentUser.uid)) {
    updated = updated.filter(id => id !== currentUser.uid);
  } else {
    updated.push(currentUser.uid);
  }

  await updateDoc(ref, { likes: updated });
};

/* ================= COMMENT ================= */

window.commentPost = async function(postId, text) {

  if (!text) return;

  const ref = doc(db, "timeline", postId);
  const snap = await getDoc(ref);

  const data = snap.data();
  const comments = data.comments || [];

  comments.push({
    uid: currentUser.uid,
    text,
    time: Date.now()
  });

  await updateDoc(ref, { comments });
};

/* ================= SHARE ================= */

window.sharePost = async function(postId) {

  const ref = doc(db, "timeline", postId);
  const snap = await getDoc(ref);

  await updateDoc(ref, {
    shares: (snap.data().shares || 0) + 1
  });
};

/* ================= TIMELINE LOAD ================= */

function loadTimeline(uid) {

  const q = query(collection(db, "timeline"));

  onSnapshot(q, (snap) => {

    const container = document.getElementById("timelinePosts");
    container.innerHTML = "";

    snap.forEach(docSnap => {

      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="post-box">

          <div style="display:flex;gap:10px;align-items:center;">
            <div style="width:40px;height:40px;border-radius:50%;background:#5bc0be;overflow:hidden;">
              ${p.userPhoto ? `<img src="${p.userPhoto}" style="width:100%;height:100%;object-fit:cover;">` : ""}
            </div>

            <div>
              <b>${p.username}</b>
              <div style="font-size:12px;opacity:0.6">${new Date(p.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <p style="margin:10px 0">${p.text}</p>

          <div style="display:flex;gap:10px;flex-wrap:wrap">

            <button onclick="likePost('${id}', ${JSON.stringify(p.likes || [])})">
              ❤️ ${p.likes?.length || 0}
            </button>

            <button onclick="commentPost('${id}', prompt('Comment:'))">
              💬 ${p.comments?.length || 0}
            </button>

            <button onclick="sharePost('${id}')">
              🔁 ${p.shares || 0}
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
        <div onclick="openUserProfile('${u.uid}')"
          style="padding:10px;background:#16213e;margin-bottom:8px;border-radius:10px;cursor:pointer;">
          ${u.username}
        </div>
      `;
    });

  });

}