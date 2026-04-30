import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= AUTH ================= */
let adminUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Access denied");
    return location.href = "dashboard.html";
  }

  adminUser = user;
  startSystem();
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadRejected();
  loadEventMonitor();
  loadStats(); // ✅ FIXED
}

/* ================= MONITOR ================= */
function loadEventMonitor() {
  const box = document.getElementById("monitor");

  onSnapshot(query(collection(db, "events"), orderBy("createdAt", "asc")), (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const e = docSnap.data();

      if (e.type === "chat") {
        box.innerHTML += `
          <div style="display:flex;justify-content:space-between;">
            <span>💬 <b>${e.username}</b>: ${e.text}</span>
            <button style="background:none;border:none;color:#00ff88;font-size:12px;cursor:pointer"
              onclick="replyToUser('${e.uid}','${e.username}')">➤</button>
          </div>
        `;
      }
    });
  });
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  onSnapshot(collection(db, "posts"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();

      box.innerHTML += `
        <div class="item" onclick="selectPost('${d.id}', \`${data.text}\`)">
          ${data.text}
          <button class="danger"
            onclick="event.stopPropagation(); deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.selectPost = (id, text) => {
  document.getElementById("editPostId").value = id;
  document.getElementById("editPostContent").value = text;
};

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  alert("Post deleted");
};

window.updatePost = async () => {
  const id = document.getElementById("editPostId").value;
  const content = document.getElementById("editPostContent").value;

  if (!id) return alert("Select a post");

  await fetch(`https://mxm-backend.onrender.com/blog/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });

  alert("Post updated");
};

/* ================= ADS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();

      box.innerHTML += `
        <div class="item">
          ${data.title}
          <button onclick="acceptAd('${d.id}')">Accept</button>
          <button onclick="rejectAd('${d.id}','${data.title}')">Reject</button>
        </div>
      `;
    });
  });
}

window.acceptAd = async (id) => {
  await deleteDoc(doc(db, "adRequests", id));
  alert("Ad accepted");
};

window.rejectAd = async (id, title) => {
  await addDoc(collection(db, "adRejected"), { title });
  await deleteDoc(doc(db, "adRequests", id));
  alert("Ad rejected");
};

window.clearAdRequests = async () => {
  const snap = await getDocs(collection(db, "adRequests"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  alert("All requests cleared");
};

/* ================= REJECTED ================= */
function loadRejected() {
  const box = document.getElementById("rejectedList");

  onSnapshot(collection(db, "adRejected"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      box.innerHTML += `<div class="item">❌ ${d.data().title}</div>`;
    });
  });
}

window.clearRejected = async () => {
  const snap = await getDocs(collection(db, "adRejected"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  alert("Rejected cleared");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      box.innerHTML += `<div class="item">${d.data().email}</div>`;
    });
  });
}

/* ================= ANALYTICS FIX ================= */
window.loadStats = async () => {
  const users = await getDocs(collection(db, "users"));
  const posts = await getDocs(collection(db, "posts"));
  const ads = await getDocs(collection(db, "adRequests"));

  document.getElementById("statUsers").textContent = users.size;
  document.getElementById("statViews").textContent = posts.size;
  document.getElementById("statRequests").textContent = ads.size;
};

/* ================= DM ================= */
window.replyToUser = async (uid, username) => {
  const msg = prompt("Reply to " + username);
  if (!msg) return;

  await addDoc(collection(db, "dms"), {
    text: msg,
    to: uid,
    from: adminUser.uid,
    createdAt: serverTimestamp()
  });
};