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
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

window.goBack = () => {
  if (document.referrer) history.back();
  else location.href = "dashboard.html";
};

/* ================= UNIVERSAL PROFILE NAV ================= */

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};

/* ================= FOLLOW FIX ================= */

window.toggleFollow = async function(targetUid) {

  const meRef = doc(db, "users", currentUser.uid);
  const themRef = doc(db, "users", targetUid);

  const meSnap = await getDoc(meRef);
  const themSnap = await getDoc(themRef);

  const me = meSnap.data();
  const them = themSnap.data();

  const isFollowing = (me.following || []).includes(targetUid);

  await updateDoc(meRef, {
    following: isFollowing ? arrayRemove(targetUid) : arrayUnion(targetUid)
  });

  await updateDoc(themRef, {
    followers: isFollowing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
  });

  loadProfile(targetUid);
};

/* ================= SHARE FIX (NO 404) ================= */

window.sharePost = function(postId) {

  const url = `${location.origin}/profile.html?post=${postId}`;

  if (navigator.share) {
    navigator.share({
      title: "MCN Engine Post",
      url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied");
  }
};

/* ================= LIKE FIX ================= */

window.likePost = async function(postId, likes = []) {

  const ref = doc(db, "timeline", postId);

  const hasLiked = (likes || []).includes(currentUser.uid);

  await updateDoc(ref, {
    likes: hasLiked
      ? arrayRemove(currentUser.uid)
      : arrayUnion(currentUser.uid)
  });
};

/* ================= COMMENT FIX ================= */

window.commentPost = async function(postId) {

  const text = prompt("Write comment:");
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