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
  orderBy,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;
let viewingUid = null;
let unsubscribeTimeline = null;

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

  loadSuggestedUsers();

  setInterval(async () => {

    try {

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
          lastActive: Date.now()
        }
      );

    } catch(err){
      console.error(err);
    }

  }, 30000);

});

/* ================= PROFILE INIT ================= */

async function ensureProfile(user){

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if(!snap.exists()){

    await setDoc(ref,{
      uid:user.uid,
      username:user.email.split("@")[0],
      email:user.email,
      bio:"MCN Engine User",
      photo:"",
      coverPhoto:"",
      followers:[],
      following:[],
      posts:0,
      likes:0,
      isPrivate:false,
      createdAt:Date.now(),
      lastActive:Date.now()
    });

  }

}

/* ================= LOAD PROFILE ================= */

async function loadProfile(uid){

  const snap = await getDoc(doc(db,"users",uid));

  if(!snap.exists()) return;

  profileData = snap.data();

  document.getElementById("username").textContent =
    profileData.username || "User";

  document.getElementById("topUsername").textContent =
    profileData.username || "Profile";

  document.getElementById("bio").textContent =
    profileData.bio || "";

  document.getElementById("postsCount").textContent =
    profileData.posts || 0;

  document.getElementById("followersCount").textContent =
    (profileData.followers || []).length;

  document.getElementById("followingCount").textContent =
    (profileData.following || []).length;

  document.getElementById("likesCount").textContent =
    profileData.likes || 0;

  const avatar =
    document.getElementById("avatar");

  if(profileData.photo){

    avatar.innerHTML =
      `<img src="${profileData.photo}">`;

  } else {

    avatar.textContent =
      (profileData.username || "U")[0]
      .toUpperCase();
  }

  const cover =
    document.getElementById("coverPhoto");

  cover.style.background =
    profileData.coverPhoto
    ? `url(${profileData.coverPhoto}) center/cover`
    : "linear-gradient(135deg,#5bc0be,#1c2541)";

  /* OWNER OR VISITOR */

  const