import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const postsDiv = document.getElementById("posts");

// CHECK LOGIN
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadPosts();
  }
});

// LOGOUT
window.logout = function () {
  signOut(auth);
};

// CREATE POST
window.createPost = async function () {
  const text = document.getElementById("postText").value;
  const link = document.getElementById("postLink").value;

  if (!text || !link) {
    alert("Fill all fields");
    return;
  }

  await addDoc(collection(db, "posts"), {
    text,
    link,
    user: auth.currentUser.email,
    clicks: 0,
    createdAt: new Date()
  });

  loadPosts();
};

// LOAD POSTS
async function loadPosts() {
  postsDiv.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "posts"));

  querySnapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const id = docSnap.id;

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user}</h4>
        <p>${post.text}</p>
        <a href="${post.link}" target="_blank" onclick="trackClick('${id}')">Visit Link</a>
        <p>Clicks: ${post.clicks}</p>
      </div>
    `;
  });
}

// TRACK CLICKS 💰
window.trackClick = async function (id) {
  const postRef = doc(db, "posts", id);

  await updateDoc(postRef, {
    clicks: increment(1)
  });
};
