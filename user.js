import { auth, db }
from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

let profileUserId = null;

let profileData = null;

/* ================= GET UID ================= */
const params =
  new URLSearchParams(
    window.location.search
  );

profileUserId =
  params.get("uid");

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "index.html";

    return;
  }

  currentUser = user;

  if (!profileUserId) {

    alert("Invalid profile");

    return;
  }

  loadProfile();

  loadUserPosts();
});

/* ================= LOAD PROFILE ================= */
async function loadProfile() {

  try {

    const ref =
      doc(db, "users", profileUserId);

    const snap =
      await getDoc(ref);

    if (!snap.exists()) {

      alert("User not found");

      return;
    }

    profileData = snap.data();

    document.getElementById(
      "username"
    ).innerHTML = `

      ${profileData.username || "user"}

      ${
        profileData.role === "admin"
        ? `<span class="badge">
            ADMIN
           </span>`
        : ""
      }
    `;

    document.getElementById(
      "bio"
    ).textContent =
      profileData.bio
      || "No bio yet";

    document.getElementById(
      "followers"
    ).textContent =
      profileData.followers || 0;

    document.getElementById(
      "following"
    ).textContent =
      profileData.following || 0;

  } catch (err) {

    console.error(err);

    alert("Failed to load profile");
  }
}

/* ================= FOLLOW ================= */
window.followUser =
async function () {

  try {

    if (
      currentUser.uid
      === profileUserId
    ) {

      alert(
        "You cannot follow yourself"
      );

      return;
    }

    await updateDoc(
      doc(db, "users", profileUserId),
      {
        followers: increment(1)
      }
    );

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        following: increment(1)
      }
    );

    alert("Followed");

    loadProfile();

  } catch (err) {

    console.error(err);

    alert("Follow failed");
  }
};

/* ================= DM ================= */
window.openDM = function () {

  location.href =
    `messages.html?uid=${profileUserId}`;
};

/* ================= POSTS ================= */
async function loadUserPosts() {

  const box =
    document.getElementById(
      "userPosts"
    );

  try {

    const q = query(
      collection(db, "posts"),
      where(
        "authorId",
        "==",
        profileUserId
      )
    );

    const snap =
      await getDocs(q);

    if (snap.empty) {

      box.innerHTML =
        "No posts yet";

      return;
    }

    box.innerHTML = "";

    snap.forEach((docSnap) => {

      const p =
        docSnap.data();

      box.innerHTML += `

        <div
          class="post"
          onclick="
            location.href=
            'post.html?id=${docSnap.id}'
          "
        >

          <h4>
            ${p.title || "Untitled"}
          </h4>

          <p>
            ${(p.content || "")
              .substring(0,120)}
          </p>

        </div>
      `;
    });

  } catch (err) {

    console.error(err);

    box.innerHTML =
      "Failed to load posts";
  }
}