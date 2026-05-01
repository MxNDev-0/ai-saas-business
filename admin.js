import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, getDoc, addDoc, collection, onSnapshot,
  deleteDoc, updateDoc, query, orderBy,
  getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg, type = "ok") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    type === "ai" ? "#00c3ff" :
    "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= AI MONITOR ================= */
function startAIMonitor() {
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type !== "added") return;

      const e = change.doc.data();

      log(`Event: ${e.type}`, "ai");

      if (e.type === "login_fail") {
        log("⚠️ Failed login detected", "warn");
      }

      if (e.type === "spam") {
        log("🚨 Spam detected", "error");
      }
    });
  });
}

/* ================= AUTH (FIXED) ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    alert("User not found");
    return;
  }

  if (snap.data().role !== "admin") {
    alert("Access denied");
    location.href = "index.html";
    return;
  }

  log("Admin online");
  startAIMonitor();

  loadPosts();
  loadUsers();
  loadAds();
  loadRejectedAds();
});

/* ================= BLOG ================= */
window.createBlog = async () => {
  const title = blogTitle.value;
  const content = blogContent.value;
  const image = blogImage.value;

  const ref = await addDoc(collection(db, "posts"), {
    title,
    content,
    image,
    createdAt: serverTimestamp()
  });

  log("Blog created: " + ref.id);
};

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${p.title}</b><br>
          <button class="small-btn" onclick="fillEdit('${d.id}', \`${p.title}\`, \`${p.content}\`)">Edit</button>
          <button class="small-btn" onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.fillEdit = (id, title, content) => {
  editPostId.value = id;
  editPostTitle.value = title;
  editPostContent.value = content;
};

window.updatePost = async () => {
  const id = editPostId.value;

  await updateDoc(doc(db, "posts", id), {
    title: editPostTitle.value,
    content: editPostContent.value
  });

  log("Post updated");
};

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("Post deleted", "warn");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), snap => {
    box.innerHTML = "";
    snap.forEach(u => {
      box.innerHTML += `<div class="item">${u.data().email}</div>`;
    });
  });
}

/* ================= ADS ================= */
function loadAds() {
  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), snap => {
    box.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${ad.title}</b><br>
          <button class="small-btn" onclick="acceptAd('${d.id}')">Accept</button>
          <button class="small-btn" onclick="rejectAd('${d.id}')">Reject</button>
        </div>
      `;
    });
  });
}

window.acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });
  log("Ad accepted");
};

window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
  log("Ad rejected", "warn");
};

function loadRejectedAds() {
  const box = document.getElementById("rejectedList");

  onSnapshot(collection(db, "adRequests"), snap => {
    box.innerHTML = "";

    snap.forEach(d => {
      if (d.data().status === "rejected") {
        box.innerHTML += `<div class="item">❌ ${d.data().title}</div>`;
      }
    });
  });
}

window.clearRejected = async () => {
  const snap = await getDocs(collection(db, "adRequests"));
  const batch = writeBatch(db);

  snap.forEach(d => {
    if (d.data().status === "rejected") batch.delete(d.ref);
  });

  await batch.commit();
  log("Rejected ads cleared");
};