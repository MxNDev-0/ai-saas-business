import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, getDoc, addDoc, collection, onSnapshot,
  deleteDoc, updateDoc, query, orderBy,
  getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR (UNCHANGED) ================= */
function log(msg, type = "ok", clickableData = null) {
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

/* ================= AUTH (UNCHANGED) ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Access denied");
    location.href = "index.html";
    return;
  }

  log("Admin online");

  loadPosts();
});

/* ================= CREATE BLOG (ONLY INJECTED FIELDS) ================= */
window.createBlog = async () => {
  const post = {
    title: blogTitle.value,
    content: blogContent.value,
    image: blogImage.value,
    createdAt: serverTimestamp(),

    visibility: {
      homepage: c_homepage.checked,
      featured: c_featured.checked,
      trending: c_trending.checked,
      dashboard: true
    },

    sponsored: {
      isSponsored: c_sponsored.checked,
      expiresAt: adExpiry.value ? new Date(adExpiry.value).getTime() : null,
      priority: Number(adPriority.value || 0)
    },

    metrics: { impressions: 0, clicks: 0 },

    admin: { approved: true }
  };

  const ref = await addDoc(collection(db, "posts"), post);

  log("Blog created: " + ref.id);
};

/* ================= POSTS (UNCHANGED LOGIC + INJECT DISPLAY FLAGS) ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${p.title}</b><br>

          F:${p.visibility?.featured ? "✔" : "✖"} |
          T:${p.visibility?.trending ? "✔" : "✖"} |
          H:${p.visibility?.homepage ? "✔" : "✖"} |
          S:${p.sponsored?.isSponsored ? "✔" : "✖"}

          <br>

          <button class="small-btn" onclick="fillEdit('${d.id}')">Edit</button>
          <button class="small-btn" onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

/* ================= EDIT (INJECTED ONLY) ================= */
window.fillEdit = async (id) => {
  const snap = await getDoc(doc(db, "posts", id));
  const p = snap.data();

  editPostId.value = id;
  editPostTitle.value = p.title;
  editPostContent.value = p.content;

  e_homepage.checked = p.visibility?.homepage;
  e_featured.checked = p.visibility?.featured;
  e_trending.checked = p.visibility?.trending;
  e_sponsored.checked = p.sponsored?.isSponsored;

  e_adExpiry.value = p.sponsored?.expiresAt
    ? new Date(p.sponsored.expiresAt).toISOString().slice(0,16)
    : "";

  e_adPriority.value = p.sponsored?.priority || 0;
};

/* ================= UPDATE (INJECTED ONLY) ================= */
window.updatePost = async () => {
  const id = editPostId.value;

  await updateDoc(doc(db, "posts", id), {
    title: editPostTitle.value,
    content: editPostContent.value,

    visibility: {
      homepage: e_homepage.checked,
      featured: e_featured.checked,
      trending: e_trending.checked,
      dashboard: true
    },

    sponsored: {
      isSponsored: e_sponsored.checked,
      expiresAt: e_adExpiry.value ? new Date(e_adExpiry.value).getTime() : null,
      priority: Number(e_adPriority.value || 0)
    }
  });

  log("Post updated");
};

/* ================= DELETE (UNCHANGED) ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("Deleted");
};

/* ================= EVERYTHING ELSE REMAINS YOUR ORIGINAL FILE ================= */