import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

/* ================= MONITOR ================= */

function log(msg){

  const box =
    document.getElementById("monitor");

  if(!box) return;

  box.innerHTML += `
    <div>
      [${new Date().toLocaleTimeString()}]
      ${msg}
    </div>
  `;

  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

  if(!user){
    location.href = "index.html";
    return;
  }

  currentUser = user;

  log("Authenticated");

  await loadProfile();
});

/* ================= LOAD PROFILE ================= */

async function loadProfile(){

  try{

    const ref =
      doc(db, "users", currentUser.uid);

    const snap =
      await getDoc(ref);

    /* CREATE PROFILE IF MISSING */

    if(!snap.exists()){

      await setDoc(ref, {

        uid: currentUser.uid,

        email: currentUser.email,

        username:
          currentUser.email.split("@")[0],

        bio: "",

        avatar: "",

        role: "user",

        followers: 0,
        following: 0,
        posts: 0,

        online: true,

        createdAt: serverTimestamp()
      });

      log("New profile created");

      return loadProfile();
    }

    const data = snap.data();

    renderProfile(data);

    log("Profile loaded");

  }catch(err){

    console.error(err);

    log("Profile failed");
  }
}

/* ================= RENDER ================= */

function renderProfile(data){

  avatar.src =
    data.avatar ||
    "https://via.placeholder.com/150";

  username.textContent =
    data.username || "Unknown";

  email.textContent =
    data.email || "";

  bio.textContent =
    data.bio || "No bio yet";

  postsCount.textContent =
    data.posts || 0;

  followersCount.textContent =
    data.followers || 0;

  followingCount.textContent =
    data.following || 0;

  /* EDIT FIELDS */

  editUsername.value =
    data.username || "";

  editAvatar.value =
    data.avatar || "";

  editBio.value =
    data.bio || "";
}

/* ================= TOGGLE EDIT ================= */

window.toggleEdit = function(){

  const card =
    document.getElementById("editCard");

  card.style.display =
    card.style.display === "none"
      ? "block"
      : "none";
};

/* ================= SAVE PROFILE ================= */

window.saveProfile = async function(){

  try{

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {

        username:
          editUsername.value.trim(),

        avatar:
          editAvatar.value.trim(),

        bio:
          editBio.value.trim(),

        online: true
      }
    );

    log("Profile updated");

    await loadProfile();

    alert("Profile saved");

  }catch(err){

    console.error(err);

    log("Save failed");
  }
};

/* ================= OPEN MESSAGES ================= */

window.openMessages = function(){

  location.href = "messages.html";
};