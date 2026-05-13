/* =========================================
   MCN ADMIN CORE V2 (CLEAN)
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= LOG ================= */

function log(msg) {
  console.log(`[MCN ADMIN] ${msg}`);
}

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "../index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().role !== "admin") {
    location.href = "../index.html";
    return;
  }

  log("Admin Auth OK");

  loadPosts();

});

/* ================= POSTS ================= */

function loadPosts(search = "") {

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {

    const container = document.getElementById("postsList");
    if (!container) return;

    container.innerHTML = "";

    snapshot.forEach(docSnap => {

      const post = docSnap.data();

      if (
        search &&
        !post.title.toLowerCase().includes(search.toLowerCase())
      ) return;

      container.innerHTML += `
        <div class="card">
          <b>${post.title}</b>
          <p>${(post.content || "").slice(0, 80)}</p>

          <button onclick="editPost('${docSnap.id}')">Edit</button>
          <button onclick="deletePost('${docSnap.id}')">Delete</button>
        </div>
      `;
    });

  });
}

/* ================= DELETE ================= */

window.deletePost = async function(id) {
  await deleteDoc(doc(db, "posts", id));
  log("Post deleted: " + id);
};

/* ================= EDIT ================= */

window.editPost = function(id) {
  document.getElementById("editPostId").value = id;
};

/* ================= UPDATE ================= */

window.updatePost = async function () {

  const id = document.getElementById("editPostId").value;
  const title = document.getElementById("editTitle").value;
  const content = document.getElementById("editContent").value;

  await updateDoc(doc(db, "posts", id), {
    title,
    content
  });

  log("Post updated");
};

/* ================= SEARCH ================= */

window.searchPosts = function () {
  const val = document.getElementById("searchPosts").value;
  loadPosts(val);
};