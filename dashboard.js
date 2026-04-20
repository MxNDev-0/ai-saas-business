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
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const API = "https://mxm-backend.onrender.com";

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
  loadChatV9();
  setupPresence();
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

  onSnapshot(collection(db, "presence"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      if (!u.online) return;

      box.innerHTML += `
        <div class="user-item">
          🟢 ${u.username || "user"}
        </div>
      `;
    });
  });
}

/* ================= CHAT V9 CORE ================= */
let chatUnsub = null;

function loadChatV9() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  /* prevent duplicate listeners (FIX V9 CRITICAL BUG) */
  if (chatUnsub) chatUnsub();

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  chatUnsub = onSnapshot(q, (snap) => {
    let html = "";
    let lastUser = null;

    snap.forEach(d => {
      const m = d.data();
      if (!m) return;

      const text = m.text || "";
      const userName = m.user || "unknown";

      const time = m.time?.toDate
        ? m.time.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

      const isMe = userName === user.email.split("@")[0];

      const grouped = lastUser === userName;
      lastUser = userName;

      html += `
        <div style="
          display:flex;
          flex-direction:column;
          align-items:${isMe ? "flex-end" : "flex-start"};
          margin:${grouped ? "2px 0" : "10px 0"};
        ">
          
          ${!grouped ? `
            <div style="font-size:11px;opacity:0.6;margin-bottom:3px;">
              ${userName}
            </div>
          ` : ""}

          <div style="
            max-width:75%;
            padding:8px 10px;
            border-radius:14px;
            background:${isMe ? "#5bc0be" : "#1c2541"};
            color:${isMe ? "#000" : "#fff"};
            font-size:13px;
            word-break:break-word;
          ">
            ${text}
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

/* ================= OPTIMISTIC SEND (V9 FEATURE) ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !user) return;

  input.value = "";

  /* instant UI feel (no delay) */
  const tempId = Date.now();

  const box = document.getElementById("chatBox");
  if (box) {
    box.innerHTML += `
      <div style="opacity:0.6;font-size:12px;">
        sending...
      </div>
    `;
  }

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp(),
    clientId: tempId
  });
};

/* ================= PRESENCE ================= */
function setupPresence() {
  if (!user) return;

  const ref = doc(db, "presence", user.uid);

  setDoc(ref, {
    uid: user.uid,
    username: user.email.split("@")[0],
    online: true,
    lastSeen: serverTimestamp()
  });

  window.addEventListener("beforeunload", async () => {
    await setDoc(ref, {
      uid: user.uid,
      username: user.email.split("@")[0],
      online: false,
      lastSeen: serverTimestamp()
    }, { merge: true });
  });
}

/* ================= MENU ================= */
window.toggleMenu = function () {
  document.getElementById("menu").classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= NAV ================= */
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