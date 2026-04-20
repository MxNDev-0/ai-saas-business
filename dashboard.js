import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;
let isAdmin = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadUsers();
  loadChatV10();
});

/* ================= USER ================= */
async function ensureUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: user.email.split("@")[0],
      role: "user"
    });
  }
}

async function loadUser() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) userData = snap.data();
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      box.innerHTML += `<div>🟢 ${u.username || "user"}</div>`;
    });
  });
}

/* ================= CHAT V10 ================= */
function loadChatV10() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";
    let lastUser = null;

    snap.forEach(d => {
      const m = d.data();
      const id = d.id;

      const userName = m.user || "unknown";
      const text = m.text || "";

      const time = m.time?.toDate?.().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }) || "";

      const isMe = userName === user.email.split("@")[0];
      const grouped = lastUser === userName;
      lastUser = userName;

      html += `
        <div class="msgBox"
          style="display:flex;flex-direction:column;align-items:${isMe ? "flex-end" : "flex-start"}">

          ${!grouped ? `<div style="font-size:11px;opacity:0.6;">${userName}</div>` : ""}

          <div style="
            max-width:75%;
            padding:8px 10px;
            border-radius:14px;
            background:${isMe ? "#5bc0be" : "#1c2541"};
            color:${isMe ? "#000" : "#fff"};
            font-size:13px;
          ">
            ${text}

            ${isAdmin ? `
              <div>
                <button onclick="deletePost('${id}')"
                  style="margin-top:5px;font-size:10px;background:red;color:white;border:none;padding:3px 6px;border-radius:4px;">
                  delete
                </button>
              </div>
            ` : ""}
          </div>

          <div style="font-size:9px;opacity:0.4;margin-top:2px;">
            ${time}
          </div>

        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  input.value = "";

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp()
  });
};

/* ================= ADMIN DELETE FIX ================= */
window.deletePost = async function (id) {
  if (!isAdmin) {
    alert("❌ Admin only");
    return;
  }

  try {
    await deleteDoc(doc(db, "posts", id));
    alert("Deleted");
  } catch (err) {
    console.error(err);
    alert("Failed to delete");
  }
};

/* ================= MENU ================= */
window.toggleMenu = function () {
  document.getElementById("menu").classList.toggle("active");
};

window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdSpace = () => location.href = "ads.html";
window.support = () => alert("Support coming soon");
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goBlog = () => location.href = "blog/index.html";

window.goAdmin = () => {
  if (!userData) return alert("Loading...");
  if (!isAdmin) return alert("❌ Admin only");
  location.href = "admin.html";
};

window.openDeveloper = () => {
  alert("Developer tools coming soon");
};