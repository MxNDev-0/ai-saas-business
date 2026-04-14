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

/* ================= CREATE POST ================= */
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

/* ================= LOAD POSTS (FIXED) ================= */
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
        <div style="margin:10px 0;padding:10px;background:#1c2541;border-radius:8px;">

          <div style="color:#fff;margin-bottom:6px;">
            ${p.text}
          </div>

          <small style="color:${isPrivate ? "orange" : "lime"}">
            ${isPrivate ? "🔒 Private" : "🌍 Public"}
          </small>

          <div style="margin-top:8px;display:flex;gap:6px;">
            <button onclick="setPublic('${id}')" style="width:auto;">Public</button>
            <button onclick="setPrivate('${id}')" style="width:auto;">Private</button>
          </div>

        </div>
      `;
    });
  });
}

/* ================= TOGGLE ================= */
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

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

window.goDashboard = () => location.href = "dashboard.html";