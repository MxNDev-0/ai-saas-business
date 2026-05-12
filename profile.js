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
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let profileData = null;
let viewingUid = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) return location.href = "index.html";

  currentUser = user;

  const params = new URLSearchParams(location.search);
  viewingUid = params.get("uid") || user.uid;

  await ensureProfile(user);

  loadProfile(viewingUid);
  loadTimeline();
  loadOnlineUsers();
  loadNotifications();

  /* LIVE ONLINE PING */
  setInterval(async () => {
    await updateDoc(doc(db, "users", currentUser.uid), {
      lastActive: Date.now()
    });
  }, 25000);

});

/* ================= PROFILE CREATE ================= */

async function ensureProfile(user) {

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {
      uid: user.uid,
      username: user.email.split("@")[0],
      bio: "MCN Engine User",
      photo: "",
      coverPhoto: "",
      followers: [],
      following: [],
      posts: 0,
      likes: 0,
      lastActive: Date.now(),
      createdAt: Date.now()
    });

  }
}

/* ================= LOAD PROFILE ================= */

async function loadProfile(uid) {

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;

  profileData = snap.data();

  document.getElementById("username").textContent = profileData.username;
  document.getElementById("topUsername").textContent = profileData.username;
  document.getElementById("bio").textContent = profileData.bio || "";

  document.getElementById("postsCount").textContent = profileData.posts || 0;
  document.getElementById("followersCount").textContent = (profileData.followers || []).length;
  document.getElementById("followingCount").textContent = (profileData.following || []).length;
}

/* ================= FOLLOW SYSTEM + NOTIFY ================= */

window.toggleFollow = async function(targetUid) {

  const meRef = doc(db, "users", currentUser.uid);
  const themRef = doc(db, "users", targetUid);

  const meSnap = await getDoc(meRef);
  const themSnap = await getDoc(themRef);

  const me = meSnap.data();
  const them = themSnap.data();

  let myFollowing = me.following || [];
  let theirFollowers = them.followers || [];

  const isFollowing = myFollowing.includes(targetUid);

  if (isFollowing) {

    myFollowing = myFollowing.filter(id => id !== targetUid);
    theirFollowers = theirFollowers.filter(id => id !== currentUser.uid);

  } else {

    myFollowing.push(targetUid);
    theirFollowers.push(currentUser.uid);

    /* 🔔 NOTIFICATION */
    await addDoc(collection(db, "notifications"), {
      to: targetUid,
      from: currentUser.uid,
      type: "follow",
      text: `${me.username} started following you`,
      createdAt: serverTimestamp(),
      seen: false
    });

  }

  await updateDoc(meRef, { following: myFollowing });
  await updateDoc(themRef, { followers: theirFollowers });

  loadProfile(targetUid);
};

/* ================= TIMELINE ================= */

window.createTimelinePost = async function () {

  const text = document.getElementById("timelinePost").value.trim();
  if (!text) return;

  await addDoc(collection(db, "timeline"), {
    uid: currentUser.uid,
    username: profileData.username,
    userPhoto: profileData.photo || "",
    text,
    likes: [],
    comments: [],
    shares: 0,
    createdAt: Date.now()
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    posts: increment(1)
  });

  document.getElementById("timelinePost").value = "";
};

/* ================= LIKE ================= */

window.likePost = async function(postId, likes = [], ownerUid) {

  const ref = doc(db, "timeline", postId);

  let updated = likes || [];

  const liked = updated.includes(currentUser.uid);

  if (liked) {
    updated = updated.filter(id => id !== currentUser.uid);
  } else {
    updated.push(currentUser.uid);

    /* 🔔 NOTIFICATION */
    if (ownerUid !== currentUser.uid) {
      await addDoc(collection(db, "notifications"), {
        to: ownerUid,
        from: currentUser.uid,
        type: "like",
        text: `${profileData.username} liked your post`,
        createdAt: serverTimestamp(),
        seen: false
      });
    }
  }

  await updateDoc(ref, { likes: updated });
};

/* ================= COMMENT ================= */

window.commentPost = async function(postId, text, ownerUid) {

  if (!text) return;

  const ref = doc(db, "timeline", postId);
  const snap = await getDoc(ref);

  const data = snap.data();
  const comments = data.comments || [];

  comments.push({
    uid: currentUser.uid,
    text,
    time: Date.now()
  });

  await updateDoc(ref, { comments });

  /* 🔔 NOTIFICATION */
  if (ownerUid !== currentUser.uid) {
    await addDoc(collection(db, "notifications"), {
      to: ownerUid,
      from: currentUser.uid,
      type: "comment",
      text: `${profileData.username} commented on your post`,
      createdAt: serverTimestamp(),
      seen: false
    });
  }

};

/* ================= SHARE ================= */

window.sharePost = async function(postId) {

  const ref = doc(db, "timeline", postId);
  const snap = await getDoc(ref);

  await updateDoc(ref, {
    shares: (snap.data().shares || 0) + 1
  });

};

/* ================= TIMELINE LOAD ================= */

function loadTimeline() {

  const q = query(collection(db, "timeline"));

  onSnapshot(q, (snap) => {

    const container = document.getElementById("timelinePosts");
    container.innerHTML = "";

    snap.forEach(docSnap => {

      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="post-box">

          <b onclick="openUserProfile('${p.uid}')" style="cursor:pointer">
            ${p.username}
          </b>

          <p>${p.text}</p>

          <div style="display:flex;gap:10px;flex-wrap:wrap">

            <button onclick="likePost('${id}', ${JSON.stringify(p.likes || [])}, '${p.uid}')">
              ❤️ ${p.likes?.length || 0}
            </button>

            <button onclick="commentPost('${id}', prompt('Comment:'), '${p.uid}')">
              💬 ${p.comments?.length || 0}
            </button>

            <button onclick="sharePost('${id}')">
              🔁 ${p.shares || 0}
            </button>

          </div>

        </div>
      `;
    });

  });
}

/* ================= NOTIFICATIONS ================= */

function loadNotifications() {

  const q = query(collection(db, "notifications"));

  onSnapshot(q, (snap) => {

    snap.forEach(async (n) => {

      const d = n.data();

      if (d.to !== currentUser.uid) return;

      console.log("🔔", d.text);

    });

  });

}

/* ================= ONLINE USERS ================= */

function loadOnlineUsers() {

  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {

    const box = document.getElementById("onlineUsers");
    box.innerHTML = "";

    snap.forEach(d => {

      const u = d.data();
      if (u.uid === currentUser.uid) return;

      const online = Date.now() - (u.lastActive || 0) < 30000;

      box.innerHTML += `
        <div onclick="openUserProfile('${u.uid}')" style="padding:10px;background:#16213e;margin:5px;border-radius:10px;">
          ${u.username} ${online ? "🟢" : "⚪"}
        </div>
      `;
    });

  });

}

/* ================= NAV ================= */

window.openUserProfile = (uid) => {
  location.href = "profile.html?uid=" + uid;
};