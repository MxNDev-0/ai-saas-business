import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment
} from "firebase/firestore";

import { getAuth, onAuthStateChanged } from "firebase/auth";

// ===== FIREBASE INIT =====
const firebaseConfig = {
  apiKey: "AIzaSyAu8BaL9NV6NU_oKSy-pxh89TuVrovZzaE",
  authDomain: "ai-saas-business-ecfab.firebaseapp.com",
  projectId: "ai-saas-business-ecfab",
  storageBucket: "ai-saas-business-ecfab.firebasestorage.app",
  messagingSenderId: "568523173235",
  appId: "1:568523173235:web:b714d052976268f1e72906"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let viewedUser = null;
let isFollowing = false;

// ===== GET UID FROM URL (?uid=xxx) =====
function getProfileUID() {
  const params = new URLSearchParams(window.location.search);
  return params.get("uid");
}

// ===== LOAD PROFILE (ANY USER) =====
async function loadProfile(uid) {
  if (!uid) return;

  viewedUser = uid;

  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    document.getElementById("loading").innerText = "User not found";
    return;
  }

  const data = snap.data();

  document.getElementById("loading").style.display = "none";
  document.getElementById("avatar").style.display = "block";

  document.getElementById("name").innerText = data.displayName || "No Name";
  document.getElementById("username").innerText = "@" + (data.username || "user");
  document.getElementById("bio").innerText = data.bio || "No bio";

  document.getElementById("avatar").src = data.photoURL || "default.png";

  document.getElementById("followers").innerText = (data.followers || 0) + " Followers";
  document.getElementById("following").innerText = (data.following || 0) + " Following";

  if (currentUser) await checkFollowState();
}

// ===== CHECK IF FOLLOWING =====
async function checkFollowState() {
  if (!currentUser || !viewedUser) return;

  const followSnap = await getDoc(
    doc(db, "follows", currentUser.uid, "following", viewedUser)
  );

  isFollowing = followSnap.exists();
  updateFollowButton();
}

// ===== TOGGLE FOLLOW =====
async function toggleFollow() {
  if (!currentUser || !viewedUser) return;
  if (currentUser.uid === viewedUser) return; // cannot follow self

  const followRef = doc(db, "follows", currentUser.uid, "following", viewedUser);
  const followerRef = doc(db, "follows", viewedUser, "followers", currentUser.uid);

  const userRef = doc(db, "users", currentUser.uid);
  const targetRef = doc(db, "users", viewedUser);

  if (isFollowing) {
    await deleteDoc(followRef);
    await deleteDoc(followerRef);

    await updateDoc(targetRef, { followers: increment(-1) });
    await updateDoc(userRef, { following: increment(-1) });

    isFollowing = false;
  } else {
    await setDoc(followRef, { createdAt: Date.now() });
    await setDoc(followerRef, { createdAt: Date.now() });

    await updateDoc(targetRef, { followers: increment(1) });
    await updateDoc(userRef, { following: increment(1) });

    isFollowing = true;
  }

  updateFollowButton();
}

// ===== BUTTON UI =====
function updateFollowButton() {
  const btn = document.getElementById("followBtn");

  if (!currentUser || currentUser.uid === viewedUser) {
    btn.style.display = "none";
    return;
  }

  btn.style.display = "block";
  btn.innerText = isFollowing ? "Unfollow" : "Follow";
  btn.classList.toggle("unfollow", isFollowing);
}

// ===== AUTH + INIT =====
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  const uid = getProfileUID();

  if (uid) {
    loadProfile(uid);
  } else if (user) {
    loadProfile(user.uid); // fallback to own profile
  } else {
    document.getElementById("loading").innerText = "Please login";
  }
});

// ===== EVENTS =====
document.getElementById("followBtn").onclick = toggleFollow;