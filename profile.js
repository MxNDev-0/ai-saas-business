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

  document.body.innerHTML = `

  <style>

    body{
      margin:0;
      background:#071028;
      color:white;
      font-family:Arial;
    }

    .topbar{

      height:65px;

      background:#101935;

      display:flex;

      align-items:center;

      justify-content:space-between;

      padding:0 15px;

      position:sticky;

      top:0;

      z-index:1000;

      box-shadow:0 2px 10px rgba(0,0,0,0.4);
    }

    .icon-btn{

      width:42px;
      height:42px;

      border-radius:12px;

      border:none;

      background:#5bc0be;

      color:black;

      font-size:18px;

      font-weight:bold;

      cursor:pointer;
    }

    .profile-header{

      position:relative;

      background:linear-gradient(
        145deg,
        #16213e,
        #0f172a
      );

      padding:20px;

      border-bottom-left-radius:25px;

      border-bottom-right-radius:25px;

      box-shadow:0 5px 20px rgba(0,0,0,0.35);
    }

    .cover{

      height:140px;

      border-radius:20px;

      background:
      linear-gradient(
        135deg,
        #5bc0be,
        #1c2541
      );

      position:relative;
    }

    .avatar{

      width:110px;
      height:110px;

      border-radius:50%;

      border:5px solid #071028;

      background:#1c2541;

      position:absolute;

      bottom:-55px;

      left:25px;

      overflow:hidden;

      display:flex;

      align-items:center;

      justify-content:center;

      font-size:38px;

      font-weight:bold;
    }

    .avatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .profile-content{
      margin-top:70px;
    }

    .username{

      font-size:26px;

      font-weight:bold;

      display:flex;

      align-items:center;

      gap:8px;
    }

    .badge{

      background:#5bc0be;

      color:black;

      font-size:11px;

      padding:4px 8px;

      border-radius:20px;

      font-weight:bold;
    }

    .bio{

      margin-top:8px;

      color:#aaa;

      line-height:1.5;
    }

    .stats{

      display:grid;

      grid-template-columns:repeat(4,1fr);

      gap:10px;

      margin-top:20px;
    }

    .stat{

      background:#111b36;

      padding:12px;

      border-radius:16px;

      text-align:center;
    }

    .stat-number{

      font-size:18px;

      font-weight:bold;

      color:#5bc0be;
    }

    .actions{

      display:flex;

      gap:10px;

      margin-top:18px;
    }

    .action-btn{

      flex:1;

      padding:12px;

      border:none;

      border-radius:14px;

      font-weight:bold;

      cursor:pointer;
    }

    .primary{
      background:#5bc0be;
      color:black;
    }

    .secondary{
      background:#1c2541;
      color:white;
    }

    .section{

      padding:15px;
    }

    .card{

      background:#111b36;

      padding:15px;

      border-radius:18px;

      margin-bottom:15px;
    }

    .section-title{

      font-size:18px;

      font-weight:bold;

      margin-bottom:12px;
    }

    .online-user{

      display:flex;

      justify-content:space-between;

      align-items:center;

      padding:10px;

      background:#16213e;

      border-radius:12px;

      margin-bottom:8px;
    }

    .online-left{

      display:flex;

      align-items:center;

      gap:10px;
    }

    .dot{

      width:10px;
      height:10px;

      background:#00ff88;

      border-radius:50%;
    }

    .mini-btn{

      border:none;

      background:#5bc0be;

      color:black;

      padding:8px 12px;

      border-radius:10px;

      font-size:12px;

      font-weight:bold;

      cursor:pointer;
    }

    .post-box{

      background:#16213e;

      border-radius:15px;

      padding:14px;

      margin-bottom:12px;
    }

    .empty{

      opacity:0.6;

      text-align:center;

      padding:20px;
    }

  </style>

  <div class="topbar">

    <button
      class="icon-btn"
      onclick="goBack()">
      ←
    </button>

    <div style="
      font-weight:bold;
      font-size:18px;
    ">
      ${user.username}
    </div>

    <button
      class="icon-btn"
      onclick="openSettings()">
      ⚙
    </button>

  </div>

  <div class="profile-header">

    <div class="cover"></div>

    <div class="avatar">

      ${
        user.photo
        ? `<img src="${user.photo}">`
        : user.username[0].toUpperCase()
      }

    </div>

    <div class="profile-content">

      <div class="username">

        ${user.username}

        ${
          user.verified
          ? `<span class="badge">VERIFIED</span>`
          : ""
        }

      </div>

      <div class="bio">
        ${user.bio || "No bio yet"}
      </div>

      <div class="stats">

        <div class="stat">
          <div class="stat-number">
            ${user.posts || 0}
          </div>
          <div>Posts</div>
        </div>

        <div class="stat">
          <div class="stat-number">
            ${user.followers || 0}
          </div>
          <div>Followers</div>
        </div>

        <div class="stat">
          <div class="stat-number">
            ${user.following || 0}
          </div>
          <div>Following</div>
        </div>

        <div class="stat">
          <div class="stat-number">
            ${user.coins || 0}
          </div>
          <div>Coins</div>
        </div>

      </div>

      <div class="actions">

        <button
          class="action-btn primary"
          onclick="editProfile()">

          Edit Profile

        </button>

        <button
          class="action-btn secondary"
          onclick="openInbox()">

          Messages

        </button>

      </div>

    </div>

  </div>

  <div class="section">

    <div class="card">

      <div class="section-title">
        🟢 Online Users
      </div>

      <div id="onlineUsers">
        Loading...
      </div>

    </div>

    <div class="card">

      <div class="section-title">
        📌 Activity
      </div>

      <div class="post-box">
        Welcome to your new MCN Engine profile.
      </div>

      <div class="post-box">
        Your future posts and creator activity will appear here.
      </div>

    </div>

  </div>
  `;

  initButtons();
}

/* ================= BUTTONS ================= */

function initButtons() {

  window.goBack = function () {
    location.href = "dashboard.html";
  };

  window.openInbox = function () {
    location.href = "messages.html";
  };

  window.editProfile = async function () {

    const username = prompt(
      "Username:",
      profileData.username || ""
    );

    if (!username) return;

    const bio = prompt(
      "Bio:",
      profileData.bio || ""
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        username,
        bio
      }
    );

    location.reload();
  };

  window.openSettings = function () {

    alert(
      "Profile settings system coming soon."
    );
  };
}

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q = query(
    collection(db, "users")
  );

  onSnapshot(q, (snap) => {

    const box =
      document.getElementById("onlineUsers");

    if (!box) return;

    box.innerHTML = "";

    snap.forEach((docSnap) => {

      const u = docSnap.data();

      if (u.uid === currentUser.uid) return;

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
            onclick="startDM('${u.uid}')">

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

  window.startDM = function(uid){

    location.href =
      "messages.html?uid=" + uid;
  };
}