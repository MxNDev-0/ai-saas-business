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
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= FIREBASE STORAGE (SAFE IMPORT) ================= */
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  await createProfileIfNeeded(user);
  await loadProfile(user.uid);
  loadOnlineUsers();
});

/* ================= STORAGE UPLOAD ================= */

async function uploadImage(file, path) {

  const storageRef = ref(path);

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/* ================= CREATE PROFILE ================= */

async function createProfileIfNeeded(user) {

  const refDoc = doc(db, "users", user.uid);

  const snap = await getDoc(refDoc);

  if (!snap.exists()) {

    await setDoc(refDoc, {

      uid: user.uid,
      username: user.email.split("@")[0],
      bio: "MCN Engine User",
      photo: "",
      coverPhoto: "",
      followers: 0,
      following: 0,
      posts: 0,
      likes: 0,
      privateAccount: false,
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

  renderProfile(profileData);
}

/* ================= RENDER PROFILE ================= */

function renderProfile(user) {

  document.getElementById("topUsername").textContent = user.username;
  document.getElementById("username").textContent = user.username;
  document.getElementById("bio").textContent = user.bio || "No bio yet";

  document.getElementById("postsCount").textContent = user.posts || 0;
  document.getElementById("followersCount").textContent = user.followers || 0;
  document.getElementById("followingCount").textContent = user.following || 0;
  document.getElementById("likesCount").textContent = user.likes || 0;

  /* COVER */
  const cover = document.getElementById("coverPhoto");

  if (user.coverPhoto) {
    cover.style.background = `url(${user.coverPhoto}) center/cover`;
  } else {
    cover.style.background = "linear-gradient(135deg,#5bc0be,#1c2541)";
  }

  /* AVATAR */
  const avatar = document.getElementById("avatar");

  if (user.photo) {
    avatar.innerHTML = `<img src="${user.photo}">`;
  } else {
    avatar.textContent = user.username?.[0]?.toUpperCase() || "U";
  }
}

/* ================= UPLOAD AVATAR ================= */

window.uploadAvatar = function () {

  const input = document.getElementById("avatarInput");

  input.click();

  input.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    try {

      const pathRef = ref(`avatars/${currentUser.uid}`);

      await uploadBytes(pathRef, file);

      const url = await getDownloadURL(pathRef);

      await updateDoc(doc(db, "users", currentUser.uid), {
        photo: url
      });

      await loadProfile(currentUser.uid);

    } catch (err) {
      console.error(err);
      alert("Avatar upload failed");
    }
  };
};

/* ================= UPLOAD COVER ================= */

window.uploadCover = function () {

  const input = document.getElementById("coverInput");

  input.click();

  input.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    try {

      const pathRef = ref(`covers/${currentUser.uid}`);

      await uploadBytes(pathRef, file);

      const url = await getDownloadURL(pathRef);

      await updateDoc(doc(db, "users", currentUser.uid), {
        coverPhoto: url
      });

      await loadProfile(currentUser.uid);

    } catch (err) {
      console.error(err);
      alert("Cover upload failed");
    }
  };
};

/* ================= BUTTONS ================= */

window.goBack = () => location.href = "dashboard.html";

window.openInbox = () => location.href = "messages.html";

window.editProfile = async function () {

  const username = prompt("Username:", profileData.username);
  const bio = prompt("Bio:", profileData.bio);

  await updateDoc(doc(db, "users", currentUser.uid), {
    username,
    bio
  });

  await loadProfile(currentUser.uid);
};

window.openSettings = async function () {

  const choice = prompt("1 username 2 bio 5 private 7 logout");

  if (choice === "7") {
    auth.signOut();
    location.href = "index.html";
  }
};

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {

    const box = document.getElementById("onlineUsers");

    box.innerHTML = "";

    snap.forEach((d) => {

      const u = d.data();
      if (u.uid === currentUser.uid) return;

      box.innerHTML += `
        <div class="online-user">
          <div class="online-left">
            <div class="dot"></div>
            <div>${u.username}</div>
          </div>
          <button class="mini-btn" onclick="startDM('${u.uid}')">💬</button>
        </div>
      `;
    });
  });
}

window.startDM = (uid) => {
  location.href = "messages.html?uid=" + uid;
};

/* ================= TIMELINE ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value;

  if (!text) return;

  await setDoc(doc(collection(db, "timeline")), {
    uid: currentUser.uid,
    username: profileData.username,
    text,
    createdAt: Date.now()
  });

  document.getElementById("timelinePost").value = "";
};