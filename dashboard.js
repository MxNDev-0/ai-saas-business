import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

let currentUser = null;
let username = "";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  document.getElementById("userEmail").innerText = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { username: "" });
  }

  username = (await getDoc(ref)).data().username || "";

  loadChat();
  loadOnlineUsers();
  loadPosts();
});

/* ================= MENU ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
};

/* ================= NAV ================= */
window.goProfile = () => window.location.href = "profile.html";

window.goUpgrade = () => {
  window.location.href = "https://nowpayments.io/payment/?iid=5153003613";
};

window.goSupport = () => {
  window.location.href = "support.html";
};

window.goFAQ = () => {
  window.location.href = "faq.html";
};

window.openSupport = () => {
  alert("Contact: support@mxmcrypto.com");
};

window.openMySection = () => {
  if (currentUser.email !== ADMIN_EMAIL) {
    alert("❌ Not authorized");
    return;
  }
  alert("👑 Welcome Admin Office");
};

/* ================= USERNAME ================= */
window.setUsername = async function () {
  const name = prompt("Enter username:");
  if (!name) return;

  await setDoc(doc(db, "users", currentUser.uid), {
    username: name
  });

  username = name;
  alert("Username saved");
};

/* ================= PASSWORD ================= */
window.changePassword = async function () {
  const pass = prompt("New password:");
  if (!pass) return;

  await updatePassword(currentUser, pass);
  alert("Password updated");
};

/* ================= CHAT FIX (REAL TIME) ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!username) return alert("Set username first");
  if (!text) return;

  await addDoc(collection(db, "generalChat"), {
    name: username,
    text,
    time: Date.now()
  });

  input.value = "";
};

/* REAL TIME CHAT */
function loadChat() {
  const q = query(
    collection(db, "generalChat"),
    orderBy("time")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

      box.innerHTML += `
        <div class="chat-msg">
          <b>${m.name}</b>: ${m.text}
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= ONLINE USERS ================= */
function loadOnlineUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    box.innerHTML = "";

    snap.forEach(doc => {
      const u = doc.data();
      if (u.username) {
        box.innerHTML += `<div class="user-small">🟢 ${u.username}</div>`;
      }
    });
  });
}

/* ================= POSTS ================= */
window.createPost = async function () {
  const text = document.getElementById("postText")?.value;

  if (!text) return;

  const isAdmin = currentUser.email === ADMIN_EMAIL;

  await addDoc(collection(db, "posts"), {
    text,
    user: username || "user",
    time: Date.now()
  });
};

function loadPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="post">
          <b>${p.user}</b>
          <p>${p.text}</p>
        </div>
      `;
    });
  });
}

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};