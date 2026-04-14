import { auth, db } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;

// AUTH
onAuthStateChanged(auth, async (user) => {
  document.getElementById("loader").style.display = "none";

  if (!user) return window.location.href = "index.html";

  currentUser = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      lastPost: 0,
      premium: false
    });

    currentUserData = { lastPost: 0, premium: false };
  } else {
    currentUserData = snap.data();
  }

  loadPosts();
});

// NAVIGATION
window.goHome = () => loadPosts();

window.goProfile = () => {
  window.location.href = "profile.html";
};

window.goUpgrade = () => {
  alert("Redirecting to upgrade...");
  window.location.href = "https://nowpayments.io/payment/?iid=5153003613";
};

window.goSupport = () => {
  window.location.href = "support.html";
};

window.goChat = () => {
  window.location.href = "chat.html";
};

window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// POST
window.createPost = async () => {
  const text = document.getElementById("postText").value;

  if (!text) return alert("Write something");

  const now = Date.now();

  if (now - currentUserData.lastPost < 86400000) {
    return alert("Only 1 post per day");
  }

  await addDoc(collection(db, "posts"), {
    text,
    user: currentUser.email,
    time: now
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    lastPost: now
  });

  currentUserData.lastPost = now;

  document.getElementById("postText").value = "";

  loadPosts();
};

// LOAD POSTS
async function loadPosts() {
  const snapshot = await getDocs(collection(db, "posts"));
  const postsDiv = document.getElementById("posts");

  postsDiv.innerHTML = "";

  snapshot.forEach(doc => {
    const post = doc.data();

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user}</h4>
        <p>${post.text}</p>
      </div>
    `;
  });
}

// CLIP BUTTON (v2 lock)
window.openUpload = () => {
  alert("Image upload available in Version 2");
};