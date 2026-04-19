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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* AUTH */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadPosts();
  loadUsername();
});

/* MENU */
window.toggleMenu = () => {
  const m = document.getElementById("dropdownMenu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

/* TOAST */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 2500);
}

/* USERNAME */
async function loadUsername() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const display = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    display.innerText = snap.data().username;
  } else {
    display.innerText = "Not set";
  }
}

/* UPDATE USERNAME */
window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return;

  await setDoc(doc(db, "users", user.uid), {
    username
  }, { merge: true });

  document.getElementById("usernameDisplay").innerText = username;

  input.value = "";
  showToast("Username updated");
};

/* RESET PASSWORD */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  showToast("Reset email sent");
};

/* CREATE POST */
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

/* LOAD POSTS */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("myPosts");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      if (p.user !== user.email.split("@")[0]) return;

      box.innerHTML += `
        <div class="post">

          <div>${p.text}</div>

          <!-- 3 DOT MENU -->
          <div class="dots" onclick="toggleMenuPost('${id}')">⋮</div>

          <div id="menu-${id}" class="post-menu">
            <button onclick="makePublic('${id}')">Make Public</button>
            <button onclick="makePrivate('${id}')">Make Private</button>
          </div>

        </div>
      `;
    });
  });
}

/* TOGGLE MENU */
window.toggleMenuPost = (id) => {
  const m = document.getElementById("menu-" + id);
  m.style.display = m.style.display === "flex" ? "none" : "flex";
};

/* VISIBILITY CONTROL */
window.makePublic = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "public"
  });

  showToast("Your post is now PUBLIC 🌍");
};

window.makePrivate = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "private"
  });

  showToast("Your post is now PRIVATE 🔒");
};