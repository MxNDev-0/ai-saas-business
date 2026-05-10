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

/* ================= CREATE PROFILE ================= */

async function createProfileIfNeeded(user) {

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {

      uid: user.uid,

      username:
        user.email.split("@")[0],

      bio:
        "MCN Engine User",

      photo:
        "",

      verified: false,

      followers: 0,

      following: 0,

      posts: 0,

      coins: 0,

      role: "user",

      createdAt: Date.now(),

      lastActive: Date.now()
    });
  }
}

/* ================= LOAD PROFILE ================= */

async function loadProfile(uid) {

  const snap = await getDoc(
    doc(db, "users", uid)
  );

  if (!snap.exists()) return;

  profileData = snap.data();

  renderProfile(profileData);
}

/* ================= RENDER PROFILE ================= */

function renderProfile(user) {

  document.getElementById(
    "topUsername"
  ).textContent = user.username;

  document.getElementById(
    "username"
  ).textContent = user.username;

  document.getElementById(
    "bio"
  ).textContent =
    user.bio || "No bio yet";

  document.getElementById(
    "postsCount"
  ).textContent =
    user.posts || 0;

  document.getElementById(
    "followersCount"
  ).textContent =
    user.followers || 0;

  document.getElementById(
    "followingCount"
  ).textContent =
    user.following || 0;

  document.getElementById(
    "coinsCount"
  ).textContent =
    user.coins || 0;

  const avatar =
    document.getElementById("avatar");

  if (user.photo) {

    avatar.innerHTML =
      `<img src="${user.photo}">`;

  } else {

    avatar.textContent =
      user.username[0].toUpperCase();
  }
}

/* ================= BUTTONS ================= */

window.goBack = function () {

  location.href = "dashboard.html";
};

window.openInbox = function () {

  location.href = "messages.html";
};

window.editProfile = async function () {

  try {

    const username = prompt(
      "Enter username:",
      profileData.username || ""
    );

    if (!username) return;

    const bio = prompt(
      "Enter bio:",
      profileData.bio || ""
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        username,
        bio
      }
    );

    await loadProfile(currentUser.uid);

    alert("Profile updated");

  } catch (err) {

    console.error(err);

    alert("Update failed");
  }
};

window.openSettings = function () {

  alert(
    "Settings system coming soon"
  );
};

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q = query(
    collection(db, "users")
  );

  onSnapshot(q, (snap) => {

    const box =
      document.getElementById(
        "onlineUsers"
      );

    if (!box) return;

    box.innerHTML = "";

    snap.forEach((docSnap) => {

      const u = docSnap.data();

      if (u.uid === currentUser.uid)
        return;

      box.innerHTML += `

        <div class="online-user">

          <div class="online-left">

            <div class="dot"></div>

            <div>
              ${u.username}
            </div>

          </div>

          <button
            class="mini-btn"
            onclick="startDM('${u.uid}')"
          >
            Message
          </button>

        </div>
      `;
    });

    if (box.innerHTML === "") {

      box.innerHTML = `

        <div class="empty">
          No users online
        </div>

      `;
    }
  });
}

/* ================= START DM ================= */

window.startDM = function(uid){

  location.href =
    "messages.html?uid=" + uid;
};