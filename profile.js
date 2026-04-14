import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";
  user = u;

  loadPosts();
});

/* ================= CREATE POST (UNCHANGED) ================= */
window.createPost = async () => {
  const input = document.getElementById("postInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    visibility: "public",
    time: Date.now()
  });

  input.value = "";
};

/* ================= LOAD POSTS (UI ONLY IMPROVED) ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("myPosts");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      if (p.user !== user.email.split("@")[0]) return;

      const isPrivate = p.visibility === "private";

      box.innerHTML += `
        <div class="post">

          <div>${p.text}</div>

          <div style="margin-top:6px;">
            <span class="${isPrivate ? "tag-private" : "tag-public"}">
              ${isPrivate ? "🔒 Private" : "🌍 Public"}
            </span>
          </div>

          <div class="controls">
            <button onclick="setPublic('${id}')">Public</button>
            <button onclick="setPrivate('${id}')">Private</button>
          </div>

        </div>
      `;
    });
  });
}

/* ================= TOGGLE (UNCHANGED LOGIC) ================= */
window.setPublic = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "public"
  });
};

window.setPrivate = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "private"
  });
};

/* MENU (UNCHANGED) */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

window.goDashboard = () => location.href = "dashboard.html";