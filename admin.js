import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, getDoc, addDoc, collection, onSnapshot,
  deleteDoc, updateDoc, query, orderBy,
  getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg, type = "ok", data = null) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    type === "ai" ? "#00c3ff" :
    "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;

  // ✅ CLICKABLE EVENT
  if (type === "ai" && data) {
    div.style.cursor = "pointer";
    div.style.textDecoration = "underline";

    div.onclick = () => {
      if (data.postId) {
        window.open("../blog/post.html?id=" + data.postId, "_blank");
      } else {
        alert("No linked content");
      }
    };
  }

  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) return location.href = "index.html";

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return location.href = "index.html";

    if (snap.data().role !== "admin") {
      alert("Access denied");
      return location.href = "index.html";
    }

    log("Admin online");

    startAIMonitor();
    loadPosts();
    loadUsers();
    loadAds();
    loadRejectedAds();

  } catch (err) {
    log("Auth error: " + err.message, "error");
  }
});

/* ================= AI MONITOR (CLICK FIX) ================= */
function startAIMonitor() {
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type !== "added") return;

      const e = change.doc.data();

      log(`Event: ${e.type}`, "ai", e); // ✅ PASS DATA
    });
  });
}

/* ================= BLOG ================= */
window.createBlog = async () => {
  const title = document.getElementById("blogTitle").value;
  const content = document.getElementById("blogContent").value;
  const image = document.getElementById("blogImage").value;

  if (!title || !content) return alert("Title and content required");

  const ref = await addDoc(collection(db, "posts"), {
    title,
    content,
    image,
    createdAt: new Date(),
    serverTime: serverTimestamp()
  });

  log("Blog created: " + ref.id);
};

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  const q = query(collection(db, "posts"));

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

    docs.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    docs.forEach(p => {
      const safeTitle = encodeURIComponent(p.title || "");
      const safeContent = encodeURIComponent(p.content || "");

      box.innerHTML += `
        <div class="item">
          <b>${p.title}</b><br>

          <button class="small-btn"
            onclick="fillEdit('${p.id}','${safeTitle}','${safeContent}')">
            Edit
          </button>

          <button class="small-btn"
            onclick="deletePost('${p.id}')">
            Delete
          </button>
        </div>
      `;
    });
  });
}

/* ================= EDIT ================= */
window.fillEdit = (id, title, content) => {
  document.getElementById("editPostId").value = id;
  document.getElementById("editPostTitle").value = decodeURIComponent(title);
  document.getElementById("editPostContent").value = decodeURIComponent(content);
};

window.updatePost = async () => {
  const id = document.getElementById("editPostId").value;
  if (!id) return alert("No post selected");

  await updateDoc(doc(db, "posts", id), {
    title: document.getElementById("editPostTitle").value,
    content: document.getElementById("editPostContent").value
  });

  log("Post updated");
};

/* ================= DELETE (CONFIRM FIX) ================= */
window.deletePost = async (id) => {
  const confirmDelete = confirm("Delete this post permanently?");
  if (!confirmDelete) return;

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
          <button onclick="acceptAd('${d.id}')">Accept</button>
          <button onclick="rejectAd('${d.id}')">Reject</button>
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

/* ================= REJECTED ================= */
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