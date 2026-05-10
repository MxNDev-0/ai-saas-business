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
  where,
  getDocs,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileUid = null;
let profileData = null;

/* ================= LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  const params = new URLSearchParams(window.location.search);

  profileUid = params.get("uid") || user.uid;

  await ensureUserDocument(user);

  loadProfile();

  trackPresence();
});

/* ================= CREATE USER DOC ================= */

async function ensureUserDocument(user) {

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {

      uid: user.uid,

      email: user.email,

      username: user.email.split("@")[0],

      bio: "MCN Engine User",

      avatar:
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          user.email.split("@")[0]
        ),

      followers: 0,

      following: 0,

      verified: false,

      createdAt: serverTimestamp()
    });
  }
}

/* ================= LOAD PROFILE ================= */

async function loadProfile() {

  const snap = await getDoc(
    doc(db, "users", profileUid)
  );

  if (!snap.exists()) {

    document.body.innerHTML =
      "<h2>User not found</h2>";

    return;
  }

  profileData = snap.data();

  renderProfile(profileData);

  loadOnlineUsers();

  checkFollowing();
}

/* ================= RENDER PROFILE ================= */

function renderProfile(data) {

  document.body.innerHTML = `

  <div class="navbar">

    <button class="back-btn"
      onclick="location.href='dashboard.html'">

      ←

    </button>

    <h3>${data.username}</h3>

  </div>

  <div class="card">

    <div style="text-align:center;">

      <img
        src="${data.avatar}"
        style="
          width:90px;
          height:90px;
          border-radius:50%;
          object-fit:cover;
          border:3px solid #5bc0be;
        "
      >

      <h2>
        ${data.username}
        ${data.verified ? "✔️" : ""}
      </h2>

      <p style="opacity:0.8;">
        ${data.bio || ""}
      </p>

      <div style="
        display:flex;
        justify-content:center;
        gap:20px;
        margin-top:15px;
      ">

        <div>
          <b id="followersCount">
            ${data.followers || 0}
          </b>
          <br>
          Followers
        </div>

        <div>
          <b id="followingCount">
            ${data.following || 0}
          </b>
          <br>
          Following
        </div>

      </div>

      ${
        profileUid !== currentUser.uid
          ? `
        <div style="
          margin-top:20px;
          display:flex;
          gap:10px;
          justify-content:center;
        ">

          <button
            id="followBtn"
            onclick="toggleFollow()"
            style="width:auto;padding:10px 20px;">

            Follow

          </button>

          <button
            onclick="openDM()"
            style="width:auto;padding:10px 20px;">

            ✉️ Message

          </button>

        </div>
      `
          : `
        <button
          onclick="editProfile()"
          style="
            width:auto;
            padding:10px 20px;
            margin-top:20px;
          ">

          Edit Profile

        </button>
      `
      }

    </div>

  </div>

  <div class="card">

    <h3>🟢 Online Users</h3>

    <div id="onlineUsers"></div>

  </div>
  `;
}

/* ================= FOLLOW SYSTEM ================= */

window.toggleFollow = async function () {

  const followId =
    currentUser.uid + "_" + profileUid;

  const ref = doc(
    db,
    "follows",
    followId
  );

  const snap = await getDoc(ref);

  if (snap.exists()) {

    await deleteDoc(ref);

    await updateDoc(
      doc(db, "users", profileUid),
      {
        followers:
          Math.max(
            0,
            (profileData.followers || 1) - 1
          )
      }
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        following:
          Math.max(
            0,
            (
              (await getUserData(currentUser.uid))
                .following || 1
            ) - 1
          )
      }
    );

  } else {

    await setDoc(ref, {

      from: currentUser.uid,

      to: profileUid,

      createdAt: serverTimestamp()
    });

    await updateDoc(
      doc(db, "users", profileUid),
      {
        followers:
          (profileData.followers || 0) + 1
      }
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        following:
          (
            (await getUserData(currentUser.uid))
              .following || 0
          ) + 1
      }
    );
  }

  loadProfile();
};

/* ================= CHECK FOLLOW ================= */

async function checkFollowing() {

  if (profileUid === currentUser.uid)
    return;

  const followId =
    currentUser.uid + "_" + profileUid;

  const snap = await getDoc(
    doc(db, "follows", followId)
  );

  const btn =
    document.getElementById("followBtn");

  if (!btn) return;

  btn.textContent =
    snap.exists()
      ? "Following"
      : "Follow";
}

/* ================= GET USER ================= */

async function getUserData(uid) {

  const snap =
    await getDoc(doc(db, "users", uid));

  return snap.data() || {};
}

/* ================= DM ================= */

window.openDM = function () {

  location.href =
    "messages.html?uid=" + profileUid;
};

/* ================= EDIT PROFILE ================= */

window.editProfile = async function () {

  const username =
    prompt(
      "Username",
      profileData.username || ""
    );

  if (!username) return;

  const bio =
    prompt(
      "Bio",
      profileData.bio || ""
    );

  await updateDoc(
    doc(db, "users", currentUser.uid),
    {
      username,
      bio
    }
  );

  alert("Profile updated");

  loadProfile();
};

/* ================= ONLINE SYSTEM ================= */

async function trackPresence() {

  setInterval(async () => {

    await setDoc(
      doc(db, "presence", currentUser.uid),
      {
        uid: currentUser.uid,
        username:
          currentUser.email.split("@")[0],
        lastSeen: Date.now()
      }
    );

  }, 10000);
}

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const box =
    document.getElementById("onlineUsers");

  if (!box) return;

  onSnapshot(
    collection(db, "presence"),
    (snap) => {

      const now = Date.now();

      box.innerHTML = "";

      snap.forEach((d) => {

        const u = d.data();

        if (
          now - u.lastSeen > 15000
        ) return;

        if (u.uid === currentUser.uid)
          return;

        box.innerHTML += `

          <div style="
            padding:10px;
            margin-top:8px;
            background:#0b132b;
            border-radius:8px;
            display:flex;
            justify-content:space-between;
            align-items:center;
          ">

            <div>

              🟢 ${u.username}

            </div>

            <button
              onclick="location.href='profile.html?uid=${u.uid}'"
              style="
                width:auto;
                padding:6px 12px;
              ">

              View

            </button>

          </div>
        `;
      });
    }
  );
}