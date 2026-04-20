import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadUsername();
  loadPosts();
});

/* ================= MENU ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("dropdownMenu");
  if (!menu) return;

  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

/* ================= USERNAME ================= */
async function loadUsername() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  document.getElementById("usernameDisplay").innerText =
    snap.exists() && snap.data().username
      ? snap.data().username
      : "Not set";
}

/* ================= UPDATE USERNAME ================= */
window.updateUsername = async function () {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return alert("Enter username");

  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });

  document.getElementById("usernameDisplay").innerText = username;
  input.value = "";
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async function () {
  if (!user?.email) return;

  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent 📩");
};

/* ================= CREATE POST ================= */
window.createPost = async function () {
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

/* ================= LOAD POSTS ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));
  const box = document.getElementById("myPosts");

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      const id = d.id;

      if (p.user !== user.email.split("@")[0]) return;

      const isPrivate = p.visibility === "private";

      box.innerHTML += `
        <div class="post">

          <div class="post-header">
            <div class="avatar"></div>
            <div>${p.user}</div>
          </div>

          <div style="margin-top:6px;">
            ${p.text}
          </div>

          <!-- 3 DOT BUTTON -->
          <div onclick="window.togglePostMenu('${id}')" style="
            position:absolute;
            top:8px;
            right:10px;
            font-size:20px;
            cursor:pointer;
          ">⋯</div>

          <!-- DROPDOWN -->
          <div id="menu-${id}" style="
            display:none;
            position:absolute;
            top:30px;
            right:10px;
            background:#1c2541;
            border-radius:8px;
            overflow:hidden;
            z-index:999;
            min-width:140px;
          ">

            <button onclick="window.editPost('${id}')">✏️ Edit</button>

            <button onclick="window.deletePost('${id}')">🗑 Delete</button>

            <button onclick="window.toggleVisibility('${id}','${p.visibility}')">
              ${isPrivate ? "🔓 Make Public" : "🔒 Make Private"}
            </button>

          </div>

        </div>
      `;
    });
  });
}

/* ================= TOGGLE MENU ================= */
window.togglePostMenu = function (id) {
  const menu = document.getElementById("menu-" + id);
  if (!menu) return;

  const isOpen = menu.style.display === "block";

  document.querySelectorAll('[id^="menu-"]').forEach(m => {
    m.style.display = "none";
  });

  menu.style.display = isOpen ? "none" : "block";
};

/* ================= EDIT ================= */
window.editPost = async function (id) {
  const newText = prompt("Edit post:");
  if (!newText) return;

  await updateDoc(doc(db, "posts", id), {
    text: newText
  });
};

/* ================= DELETE ================= */
window.deletePost = async function (id) {
  await deleteDoc(doc(db, "posts", id));
};

/* ================= TOGGLE ================= */
window.toggleVisibility = async function (id, current) {
  const newState = current === "private" ? "public" : "private";

  await updateDoc(doc(db, "posts", id), {
    visibility: newState
  });
};