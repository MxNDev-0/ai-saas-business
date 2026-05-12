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
  serverTimestamp
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
  loadSuggestedUsers();

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
      posts: 0,
      likes: 0,
      isPrivate: false,
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

  const cover = document.getElementById("coverPhoto");
  cover.style.background = profileData.coverPhoto
    ? `url(${profileData.coverPhoto}) center/cover`
    : "linear-gradient(135deg,#5bc0be,#1c2541)";
}

/* ================= PRIVACY GUARD ================= */

function canViewProfile(profile) {
  return !profile.isPrivate || profile.uid === currentUser.uid;
}

/* ================= TIMELINE ================= */

function loadTimeline() {

  const q = query(collection(db, "timeline"));

  onSnapshot(q, (snap) => {

    const container = document.getElementById("timelinePosts");
    container.innerHTML = "";

    snap.forEach(docSnap => {

      const p = docSnap.data();

      if (p.ownerId !== viewingUid) return;

      container.innerHTML += `
        <div class="post-box">

          <b>${p.username}</b>
          <p>${p.text}</p>

        </div>
      `;

    });

  });

}

/* ================= POST CREATION FIX ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value.trim();
  if (!text) return;

  await addDoc(collection(db, "timeline"), {
    text,
    username: profileData.username,
    ownerId: currentUser.uid,
    createdAt: serverTimestamp(),
    likes: [],
    comments: []
  });

  document.getElementById("timelinePost").value = "";

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

      const online = Date.now() - (u.lastActive || 0) < 60000;

      box.innerHTML += `
        <div onclick="openUserProfile('${u.uid}')"
          style="padding:10px;margin:6px;background:#16213e;border-radius:10px;cursor:pointer;">
          ${u.username} ${online ? "🟢" : "⚫"}
        </div>
      `;

    });

  });

}

/* ================= SUGGESTED USERS ================= */

function loadSuggestedUsers() {

  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {

    const box = document.getElementById("suggestedUsers");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {

      const u = d.data();
      if (u.uid === currentUser.uid) return;

      box.innerHTML += `
        <div onclick="openUserProfile('${u.uid}')"
          style="padding:10px;margin:6px;background:#1c2541;border-radius:10px;cursor:pointer;">
          ${u.username}
        </div>
      `;

    });

  });

}

/* ================= NAV ================= */

window.goBack = () => {
  if (history.length > 1) history.back();
  else location.href = "dashboard.html";
};

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};