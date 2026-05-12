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
  where,
  orderBy
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

  loadTimelinePosts();

  /* UPDATE ONLINE STATUS */

  setInterval(async () => {

    try {

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
          lastActive: Date.now()
        }
      );

    } catch (e) {}

  }, 30000);

});

/* ================= CREATE PROFILE ================= */

async function createProfileIfNeeded(user) {

  const refDoc =
  doc(db, "users", user.uid);

  const snap =
  await getDoc(refDoc);

  if (!snap.exists()) {

    await setDoc(refDoc, {

      uid: user.uid,

      username:
      user.email.split("@")[0],

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

  const snap =
  await getDoc(
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
  ).textContent =
  user.username;

  document.getElementById(
    "username"
  ).textContent =
  user.username;

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
    "likesCount"
  ).textContent =
  user.likes || 0;

  /* COVER */

  const cover =
  document.getElementById(
    "coverPhoto"
  );

  if (user.coverPhoto) {

    cover.style.background =
    `url(${user.coverPhoto}) center/cover`;

  } else {

    cover.style.background =
    "linear-gradient(135deg,#5bc0be,#1c2541)";

  }

  /* AVATAR */

  const avatar =
  document.getElementById(
    "avatar"
  );

  if (user.photo) {

    avatar.innerHTML =
    `<img src="${user.photo}">`;

  } else {

    avatar.textContent =
    user.username?.[0]?.toUpperCase() || "U";

  }

}

/* ================= COMING SOON ================= */

window.uploadAvatar = function () {

  alert(
    "Avatar upload coming soon"
  );

};

window.uploadCover = function () {

  alert(
    "Cover upload coming soon"
  );

};

/* ================= BUTTONS ================= */

window.goBack =
() => location.href =
"dashboard.html";

window.openInbox =
() => location.href =
"messages.html";

/* ================= EDIT PROFILE ================= */

window.editProfile =
async function () {

  const username =
  prompt(
    "Username:",
    profileData.username
  );

  if (username === null) return;

  const bio =
  prompt(
    "Bio:",
    profileData.bio
  );

  if (bio === null) return;

  await updateDoc(

    doc(
      db,
      "users",
      currentUser.uid
    ),

    {
      username,
      bio
    }

  );

  await loadProfile(
    currentUser.uid
  );

};

/* ================= SETTINGS ================= */

window.openSettings =
function () {

  const existing =
  document.getElementById(
    "settingsModal"
  );

  if (existing) {
    existing.remove();
  }

  const modal =
  document.createElement("div");

  modal.id =
  "settingsModal";

  modal.innerHTML = `

    <div
      style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.7);
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
      "
    >

      <div
        style="
          width:100%;
          max-width:380px;
          background:#111b36;
          border-radius:24px;
          padding:25px;
          box-shadow:0 10px 40px rgba(0,0,0,0.5);
        "
      >

        <div
          style="
            font-size:22px;
            font-weight:bold;
            margin-bottom:20px;
          "
        >
          ⚙ Settings
        </div>

        <button
          id="editProfileBtn"
          style="
            width:100%;
            border:none;
            padding:15px;
            border-radius:14px;
            background:#16213e;
            color:white;
            margin-bottom:12px;
            font-size:15px;
            font-weight:bold;
          "
        >
          ✏ Edit Profile
        </button>

        <button
          id="closeSettingsBtn"
          style="
            width:100%;
            border:none;
            padding:15px;
            border-radius:14px;
            background:#1c2541;
            color:white;
            font-size:15px;
            font-weight:bold;
          "
        >
          Close
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  document.getElementById(
    "closeSettingsBtn"
  ).onclick = () => {

    modal.remove();

  };

  document.getElementById(
    "editProfileBtn"
  ).onclick = async () => {

    modal.remove();

    editProfile();

  };

};

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q =
  query(
    collection(db, "users")
  );

  onSnapshot(q, (snap) => {

    const box =
    document.getElementById(
      "onlineUsers"
    );

    box.innerHTML = "";

    snap.forEach((d) => {

      const u =
      d.data();

      if (
        u.uid === currentUser.uid
      ) return;

      box.innerHTML += `

        <div class="online-user">

          <div class="online-left">

            ${
              Date.now() -
              (u.lastActive || 0)
              < 120000

              ? `<div class="dot"></div>`

              : `<div class="dot" style="background:gray;"></div>`
            }

            <div>
              ${u.username}
            </div>

          </div>

          <button
            class="mini-btn"
            onclick="startDM('${u.uid}')"
          >
            💬
          </button>

        </div>

      `;

    });

  });

}

window.startDM =
(uid) => {

  location.href =
  "messages.html?uid=" + uid;

};

/* ================= TIMELINE ================= */

window.createTimelinePost =
async function () {

  const text =

  document.getElementById(
    "timelinePost"
  )

  .value

  .trim();

  if (!text) {

    alert(
      "Write something first"
    );

    return;

  }

  try {

    const postRef =

    doc(
      collection(
        db,
        "timeline"
      )
    );

    await setDoc(

      postRef,

      {

        postId:
        postRef.id,

        uid:
        currentUser.uid,

        username:
        profileData.username,

        userPhoto:
        profileData.photo || "",

        text:
        text,

        likes: 0,

        comments: 0,

        createdAt:
        Date.now()

      }

    );

    /* UPDATE POSTS */

    await updateDoc(

      doc(
        db,
        "users",
        currentUser.uid
      ),

      {

        posts:
        (profileData.posts || 0) + 1

      }

    );

    /* CLEAR INPUT */

    document.getElementById(
      "timelinePost"
    ).value = "";

    /* RELOAD PROFILE */

    await loadProfile(
      currentUser.uid
    );

    alert(
      "Post published"
    );

  } catch (err) {

    console.error(err);

    alert(
      "Timeline failed: " +
      err.message
    );

  }

};

/* ================= LOAD TIMELINE POSTS ================= */

function loadTimelinePosts() {

  const postsBox =
  document.getElementById(
    "timelinePosts"
  );

  const q =
  query(
    collection(db, "timeline"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {

    postsBox.innerHTML = "";

    if (snap.empty) {

      postsBox.innerHTML = `

        <div class="empty">
          No posts yet
        </div>

      `;

      return;
    }

    snap.forEach((docSnap) => {

      const post =
      docSnap.data();

      const div =
      document.createElement("div");

      div.className =
      "post-box";

      div.innerHTML = `

        <div
          style="
            display:flex;
            align-items:center;
            gap:10px;
            margin-bottom:10px;
          "
        >

          <div
            style="
              width:42px;
              height:42px;
              border-radius:50%;
              overflow:hidden;
              background:#1c2541;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:bold;
            "
          >

            ${
              post.userPhoto

              ? `<img
                  src="${post.userPhoto}"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                  "
                >`

              : post.username?.[0]?.toUpperCase() || "U"
            }

          </div>

          <div>

            <div
              style="
                font-weight:bold;
              "
            >
              ${post.username}
            </div>

            <div
              style="
                font-size:12px;
                opacity:.6;
              "
            >
              ${new Date(post.createdAt).toLocaleString()}
            </div>

          </div>

        </div>

        <div
          style="
            line-height:1.5;
          "
        >
          ${post.text}
        </div>

      `;

      postsBox.appendChild(div);

    });

  });

}