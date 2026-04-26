import { auth, db } from "./firebase.js";
import { app } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= BOOT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");

  if (box) box.innerHTML = "🟢 Initializing Admin Panel...";

  setTimeout(() => {
    log("🚀 System ready");
    log("📡 Monitor online");
  }, 500);
});

/* ================= CHAT → MONITOR ================= */
function loadChatToMonitor() {
  const q = query(
    collection(db, "chats/messages"),
    orderBy("timestamp", "asc")
  );

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const msg = change.doc.data();
        log(`💬 ${msg.username}: ${msg.text}`);
      }
    });
  });
}

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = broadcastTitle.value;
  const message = broadcastMessage.value;

  if (!title || !message) return log("⚠️ Fill fields");

  await addDoc(collection(db, "broadcasts"), {
    title,
    message,
    createdAt: Date.now(),
    createdBy: auth.currentUser?.uid || "admin",
    active: true
  });

  log("🔔 Broadcast sent: " + title);

  broadcastTitle.value = "";
  broadcastMessage.value = "";
};

/* ================= ADMIN GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
  } else {
    log("🔐 Admin logged in");
    startSystem();
    loadChatToMonitor(); // ✅ CHAT IN MONITOR
  }
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
}

/* USERS */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      box.innerHTML += `<div class="item">${d.data().email}</div>`;
    });
  });
}

/* POSTS */
function loadPosts() {
  const box = document.getElementById("postsList");

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="item">
          ${p.text}
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Post deleted");
};

window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("🧹 All posts cleared");
};

/* ADS */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          ${ad.title}<br>
          ${ad.status || "pending"}
        </div>
      `;
    });
  });
}