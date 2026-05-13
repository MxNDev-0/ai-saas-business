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
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;
let viewingUid = null;
let unsubscribeTimeline = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

  if(!user){

    location.href = "index.html";
    return;

  }

  currentUser = user;

  const params =
    new URLSearchParams(
      location.search
    );

  viewingUid =
    params.get("uid") || user.uid;

  await ensureProfile(user);

  await loadProfile(viewingUid);

  loadTimeline();

  loadOnlineUsers();

  loadSuggestedUsers();

  startPresence();

});

/* ================= PROFILE INIT ================= */

async function ensureProfile(user){

  const ref =
    doc(db,"users",user.uid);

  const snap =
    await getDoc(ref);

  if(!snap.exists()){

    await setDoc(ref,{
      uid:user.uid,
      username:
        user.email.split("@")[0],
      email:user.email,
      bio:"MCN Engine User",
      photo:"",
      coverPhoto:"",
      followers:[],
      following:[],
      posts:0,
      likes:0,
      createdAt:Date.now(),
      lastActive:Date.now()
    });

  }

}

/* ================= LOAD PROFILE ================= */

async function loadProfile(uid){

  const snap =
    await getDoc(
      doc(db,"users",uid)
    );

  if(!snap.exists()) return;

  profileData = snap.data();

  document.getElementById(
    "username"
  ).textContent =
    profileData.username || "User";

  document.getElementById(
    "topUsername"
  ).textContent =
    profileData.username || "Profile";

  document.getElementById(
    "bio"
  ).textContent =
    profileData.bio || "No bio yet";

  document.getElementById(
    "postsCount"
  ).textContent =
    profileData.posts || 0;

  document.getElementById(
    "followersCount"
  ).textContent =
    (profileData.followers || []).length;

  document.getElementById(
    "followingCount"
  ).textContent =
    (profileData.following || []).length;

  document.getElementById(
    "likesCount"
  ).textContent =
    profileData.likes || 0;

  const avatar =
    document.getElementById(
      "avatar"
    );

  if(profileData.photo){

    avatar.innerHTML = `
      <img src="${profileData.photo}">
    `;

  }else{

    avatar.textContent =
      (profileData.username || "U")[0]
      .toUpperCase();

  }

  const cover =
    document.getElementById(
      "coverPhoto"
    );

  cover.style.background =
    profileData.coverPhoto
    ? `url(${profileData.coverPhoto}) center/cover`
    : "linear-gradient(135deg,#5bc0be,#1c2541)";

  /* OWNER OR VISITOR */

  if(viewingUid === currentUser.uid){

    document.getElementById(
      "ownerActions"
    ).style.display = "flex";

    document.getElementById(
      "visitorActions"
    ).style.display = "none";

  }else{

    document.getElementById(
      "ownerActions"
    ).style.display = "none";

    document.getElementById(
      "visitorActions"
    ).style.display = "flex";

  }

}

/* ================= EDIT PROFILE ================= */

window.editProfile = async function(){

  const username =
    prompt(
      "Enter new username",
      profileData.username || ""
    );

  if(!username) return;

  const bio =
    prompt(
      "Enter new bio",
      profileData.bio || ""
    );

  await updateDoc(
    doc(db,"users",currentUser.uid),
    {
      username,
      bio
    }
  );

  alert("Profile updated");

  loadProfile(currentUser.uid);

};

/* ================= MESSAGE BUTTON ================= */

window.messageUser = function(){

  location.href =
    `messages.html?uid=${viewingUid}`;

};

/* ================= CREATE POST ================= */

window.createTimelinePost = async function(){

  const text =
    document.getElementById(
      "timelinePost"
    ).value.trim();

  if(!text){

    alert("Write something");
    return;

  }

  try{

    await addDoc(
      collection(db,"timelinePosts"),
      {
        uid:currentUser.uid,
        username:
          profileData.username || "User",
        text,
        createdAt:serverTimestamp()
      }
    );

    await updateDoc(
      doc(db,"users",currentUser.uid),
      {
        posts:increment(1)
      }
    );

    document.getElementById(
      "timelinePost"
    ).value = "";

  }catch(err){

    console.error(err);

    alert("Post failed");

  }

};

/* ================= LOAD POSTS ================= */

function loadTimeline(){

  const box =
    document.getElementById(
      "timelinePosts"
    );

  if(!box) return;

  const q =
    query(
      collection(db,"timelinePosts"),
      orderBy("createdAt","desc")
    );

  unsubscribeTimeline =
    onSnapshot(q,(snap)=>{

      box.innerHTML = "";

      if(snap.empty){

        box.innerHTML = `
          <div class="empty">
            No posts yet
          </div>
        `;

        return;

      }

      snap.forEach((d)=>{

        const p = d.data();

        if(p.uid !== viewingUid)
          return;

        box.innerHTML += `
          <div class="post-box">

            <b>
              ${p.username || "User"}
            </b>

            <div style="
              margin-top:10px;
              line-height:1.5;
            ">
              ${p.text}
            </div>

          </div>
        `;

      });

    });

}

/* ================= ONLINE USERS ================= */

function loadOnlineUsers(){

  const box =
    document.getElementById(
      "onlineUsers"
    );

  if(!box) return;

  onSnapshot(
    collection(db,"users"),
    (snap)=>{

      box.innerHTML = "";

      const now = Date.now();

      snap.forEach((d)=>{

        const u = d.data();

        if(u.uid === currentUser.uid)
          return;

        const online =
          now - (u.lastActive || 0)
          < 120000;

        box.innerHTML += `
          <div class="user-item">

            <div class="user-left">

              <div class="${
                online
                ? "online-dot"
                : "offline-dot"
              }"></div>

              <div>
                ${u.username || "User"}
              </div>

            </div>

            <button
              class="user-btn"
              onclick="
                location.href=
                'profile.html?uid=${u.uid}'
              "
            >
              View
            </button>

          </div>
        `;

      });

    }
  );

}

/* ================= SUGGESTED USERS ================= */

function loadSuggestedUsers(){

  const box =
    document.getElementById(
      "suggestedUsers"
    );

  if(!box) return;

  onSnapshot(
    collection(db,"users"),
    (snap)=>{

      box.innerHTML = "";

      snap.forEach((d)=>{

        const u = d.data();

        if(u.uid === currentUser.uid)
          return;

        box.innerHTML += `
          <div class="user-item">

            <div class="user-left">

              <div class="online-dot"></div>

              <div>
                ${u.username || "User"}
              </div>

            </div>

            <button
              class="user-btn"
              onclick="
                location.href=
                'profile.html?uid=${u.uid}'
              "
            >
              Open
            </button>

          </div>
        `;

      });

    }
  );

}

/* ================= PRESENCE ================= */

function startPresence(){

  setInterval(async()=>{

    try{

      await updateDoc(
        doc(db,"users",currentUser.uid),
        {
          lastActive:Date.now()
        }
      );

    }catch(err){

      console.error(err);

    }

  },30000);

}

/* ================= NAVIGATION ================= */

window.goBack = function(){

  history.back();

};