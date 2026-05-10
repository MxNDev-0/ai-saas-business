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

      coverPhoto:
        "",

      verified: false,

      followers: 0,

      following: 0,

      posts: 0,

      likes: 0,

      role: "user",

      privateAccount: false,

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
    "likesCount"
  ).textContent =
    user.likes || 0;

  const cover =
    document.getElementById(
      "coverPhoto"
    );

  if (user.photo || user.avatar) {

    cover.style.background = `
      url(${user.coverPhoto})
      center/cover
    `;
  }

  const avatar =
    document.getElementById("avatar");

  if (user.photo) {

    avatar.innerHTML =
      `<img src="${
  user.photo || user.avatar
}">

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

window.openSettings = async function () {

  const choice = prompt(

`PROFILE SETTINGS

1 = Change Username
2 = Change Bio
3 = Change Avatar URL
4 = Change Cover URL
5 = Private Account
6 = Contact Support
7 = Logout

Enter number:`

  );

  if (!choice) return;

  if (choice === "1") {

    const username = prompt(
      "New username:",
      profileData.username || ""
    );

    if (!username) return;

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        username
      }
    );

    await loadProfile(currentUser.uid);

    alert("Username updated");
  }

  if (choice === "2") {

    const bio = prompt(
      "New bio:",
      profileData.bio || ""
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        bio
      }
    );

    await loadProfile(currentUser.uid);

    alert("Bio updated");
  }

  if (choice === "3") {

    const photo = prompt(
      "Avatar image URL:",
      profileData.photo || ""
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        photo
      }
    );

    await loadProfile(currentUser.uid);

    alert("Avatar updated");
  }

  if (choice === "4") {

    const coverPhoto = prompt(
      "Cover image URL:",
      profileData.coverPhoto || ""
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        coverPhoto
      }
    );

    alert("Cover updated");

    location.reload();
  }

  if (choice === "5") {

    const current =
      profileData.privateAccount || false;

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        privateAccount: !current
      }
    );

    alert(
      !current
        ? "Account is now private"
        : "Account is now public"
    );
  }

  if (choice === "6") {

    alert(
      "Contact support from MCN Engine support center."
    );
  }

  if (choice === "7") {

    auth.signOut();

    location.href = "index.html";
  }
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

    const now = Date.now();

    snap.forEach((docSnap) => {

      const u = docSnap.data();

      if (u.uid === currentUser.uid)
        return;

      const lastActive =
        u.lastActive || 0;

      const isOnline =
        now - lastActive < 120000;

      box.innerHTML += `

        <div class="online-user">

          <div class="online-left">

            <div
              class="dot"
              style="
                background:
                ${isOnline
                  ? '#00ff88'
                  : '#777'
                };
              "
            ></div>

            <div>

              ${u.username}

              <div style="
                font-size:11px;
                opacity:0.7;
                margin-top:2px;
              ">

                ${
                  isOnline
                    ? "Online"
                    : "Offline"
                }

              </div>

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

    if (box.innerHTML === "") {

      box.innerHTML = `

        <div class="empty">
          No users found
        </div>

      `;
    }
  });

  setInterval(async () => {

    if (!currentUser) return;

    try {

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
          lastActive: Date.now()
        }
      );

    } catch(err) {

      console.log(err);
    }

  }, 30000);
}

/* ================= START DM ================= */

window.startDM = function(uid){

  location.href =
    "messages.html?uid=" + uid;
};

/* ================= TIMELINE POST ================= */

window.createTimelinePost = async function () {

  const text =
    document.getElementById(
      "timelinePost"
    ).value.trim();

  if (!text) return;

  try {

    await setDoc(
      doc(
        collection(db, "timeline")
      ),
      {

        uid: currentUser.uid,

        username:
          profileData.username,

        text,

        createdAt: Date.now()
      }
    );

    document.getElementById(
      "timelinePost"
    ).value = "";

    alert("Posted");

  } catch(err) {

    console.log(err);

    alert("Failed");
  }
};