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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const API = "https://mxm-backend.onrender.com";

let user = null;
let userData = null;
let isAdmin = false;
let adsLoaded = false;

/* ================= CHAT V8 STATE ================= */
let activeChatId = null;
let unsubscribeMessages = null;

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
  loadFeed();
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

      box.innerHTML += `
        <div class="user-item">
          <span>${u.username || "user"}</span>
        </div>
      `;
    });
  });
}

/* ================= OLD FEED (UNCHANGED) ================= */
function loadFeed() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const m = docSnap.data();
      if (!m?.text) return;

      box.innerHTML += `
        <div class="msg" style="
          margin:6px 0;
          padding:6px;
          background:#1c2541;
          border-radius:6px;
          font-size:13px;
        ">
          <b>${m.user}</b>: ${m.text}
        </div>
      `;
    });

    loadAdsIntoDashboard();
  });
}

/* ================= CHAT V8 ENGINE ================= */

function getChatId(uid1, uid2) {
  return uid1 > uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}

/* OPEN CHAT */
window.openChatWith = function (otherUserId) {
  activeChatId = getChatId(user.uid, otherUserId);

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  loadMessagesV8();
};

/* LOAD CHAT MESSAGES */
function loadMessagesV8() {
  const box = document.getElementById("chatBox");
  if (!box || !activeChatId) return;

  const q = query(
    collection(db, "chats", activeChatId, "messages"),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(q, (snap) => {
    const messages = [];

    snap.forEach(d => {
      messages.push({ id: d.id, ...d.data() });
    });

    renderMessagesV8(messages);
    markSeenV8(messages);
  });
}

/* RENDER CHAT */
function renderMessagesV8(messages) {
  const box = document.getElementById("chatBox");
  if (!box) return;

  let html = "";

  messages.forEach(m => {
    const isMe = m.senderId === user.uid;

    html += `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:${isMe ? "flex-end" : "flex-start"};
        margin:6px 0;
      ">
        <div style="
          max-width:75%;
          padding:8px 10px;
          border-radius:12px;
          background:${isMe ? "#5bc0be" : "#1c2541"};
          color:${isMe ? "#000" : "#fff"};
          font-size:13px;
          word-break:break-word;
        ">
          ${m.text}
        </div>

        <small style="font-size:10px;opacity:0.5;">
          ${m.senderName || "user"} • ${m.seen ? "✓✓ seen" : "✓ sent"}
        </small>
      </div>
    `;
  });

  box.innerHTML = html;
  box.scrollTop = box.scrollHeight;
}

/* SEND MESSAGE */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !activeChatId) return;

  await addDoc(
    collection(db, "chats", activeChatId, "messages"),
    {
      text,
      senderId: user.uid,
      senderName: user.email.split("@")[0],
      createdAt: serverTimestamp(),
      seen: false
    }
  );

  input.value = "";
};

/* MARK AS SEEN */
async function markSeenV8(messages) {
  for (const m of messages) {
    if (m.senderId !== user.uid && !m.seen) {
      await updateDoc(
        doc(db, "chats", activeChatId, "messages", m.id),
        { seen: true }
      );
    }
  }
}

/* ================= ADS SYSTEM (UNCHANGED) ================= */
async function loadAdsIntoDashboard() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  if (adsLoaded) return;
  adsLoaded = true;

  try {
    const res = await fetch(`${API}/ads/list`);
    const ads = await res.json();

    ads.forEach(ad => {
      box.innerHTML += `
        <div style="
          margin:8px 0;
          padding:10px;
          border:1px dashed #5bc0be;
          border-radius:8px;
          background:#16213e;
        ">
          <div style="font-size:10px;color:#5bc0be;">SPONSORED</div>
          <b>${ad.title}</b><br/>
          <span style="font-size:13px;">${ad.text}</span><br/>

          <button onclick="openAd('${ad.id}','${ad.link}')">
            Open Ad
          </button>
        </div>
      `;
    });

  } catch (err) {
    console.log("Ads failed", err);
  }
}

/* AD CLICK */
window.openAd = function (id, link) {
  fetch(`${API}/ads/click/${id}`, { method: "POST" });
  window.location.href = link;
};

/* ================= SEND POST ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp()
  });

  input.value = "";
};

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