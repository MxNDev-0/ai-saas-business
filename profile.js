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
};

/* RESET PASSWORD */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent");
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

/* POSTS */
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

          <div class="dots" onclick="togglePostMenu('${id}')">⋮</div>

          <div id="menu-${id}" class="post-menu">
            <button onclick="setPublic('${id}')">Make Public</button>
            <button onclick="setPrivate('${id}')">Make Private</button>
          </div>

        </div>
      `;
    });
  });
}

/* TOGGLE MENU */
window.togglePostMenu = (id) => {
  const el = document.getElementById("menu-" + id);
  el.style.display = el.style.display === "flex" ? "none" : "flex";
};

/* VISIBILITY */
window.setPublic = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "public"
  });
  alert("Post is now public");
};

window.setPrivate = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "private"
  });
  alert("Post is now private");
};