import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE (NEW FEATURES) ================= */
let lastSnapshot = null;
let autosaveTimer = null;

/* ================= MONITOR ================= */
function log(msg, type = "ok") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= ADMIN AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  try {

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("User not found");
      location.href = "index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      alert("Admin access only");
      location.href = "dashboard.html";
      return;
    }

    log("Admin online");

    loadPosts();
    loadUsers();
    loadAds();
    loadRejectedAds();

    initAutosave(); // NEW

  } catch (err) {
    console.error(err);
    alert("Admin auth failed");
  }
});

/* ================= CREATE BLOG ================= */
window.createBlog = async () => {

  try {

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

      metrics: {
        impressions: 0,
        clicks: 0
      },

      admin: {
        approved: true
      },

      order: 0
    };

    const ref = await addDoc(collection(db, "posts"), post);

    log("Blog created: " + ref.id);

  } catch (err) {
    console.error(err);
    log("Create failed", "error");
  }
};

/* ================= POSTS ================= */
function loadPosts() {

  const box = document.getElementById("postsList");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {

      const p = d.data();
      const published = p.admin?.approved !== false;

      box.innerHTML += `
        <div class="item">

          <b>${p.title}</b><br><br>

          Status: ${published ? "PUBLISHED" : "HIDDEN"}<br><br>

          <button onclick="fillEdit('${d.id}')">Edit</button>
          <button onclick="togglePost('${d.id}', ${published})">Toggle</button>
          <button onclick="deletePost('${d.id}')">Delete</button>

          <br><br>

          <button onclick="moveUp('${d.id}', ${p.order || 0})">⬆</button>
          <button onclick="moveDown('${d.id}', ${p.order || 0})">⬇</button>

        </div>
      `;
    });

  });
}

/* ================= EDIT + SNAPSHOT ================= */
window.fillEdit = async (id) => {

  const snap = await getDoc(doc(db, "posts", id));

  if (!snap.exists()) return;

  const p = snap.data();

  /* SAVE SNAPSHOT FOR UNDO */
  lastSnapshot = { id, data: p };

  editPostId.value = id;
  editPostTitle.value = p.title || "";
  editPostContent.value = p.content || "";

  e_homepage.checked = p.visibility?.homepage || false;
  e_featured.checked = p.visibility?.featured || false;
  e_trending.checked = p.visibility?.trending || false;
  e_sponsored.checked = p.sponsored?.isSponsored || false;

  e_adPriority.value = p.sponsored?.priority || 0;

  e_adExpiry.value = p.sponsored?.expiresAt
    ? new Date(p.sponsored.expiresAt).toISOString().slice(0, 16)
    : "";

  updatePreview(); // NEW
};

/* ================= LIVE PREVIEW (NEW) ================= */
function updatePreview() {

  let preview = document.getElementById("livePreview");

  if (!preview) {
    preview = document.createElement("div");
    preview.id = "livePreview";
    preview.style.cssText = `
      position:fixed;
      right:10px;
      bottom:10px;
      width:250px;
      background:#1c2541;
      padding:10px;
      color:white;
      border-radius:8px;
      font-size:12px;
      z-index:9999;
    `;
    document.body.appendChild(preview);
  }

  preview.innerHTML = `
    <b>Preview</b><br><br>
    ${editPostTitle.value}<br><br>
    ${editPostContent.value?.slice(0, 80)}...
  `;
}

/* ================= AUTOSAVE (NEW) ================= */
function initAutosave() {

  const inputs = [
    "editPostTitle",
    "editPostContent"
  ];

  inputs.forEach(id => {

    const el = document.getElementById(id);

    if (!el) return;

    el.addEventListener("input", () => {

      clearTimeout(autosaveTimer);

      autosaveTimer = setTimeout(() => {

        const draft = {
          title: editPostTitle.value,
          content: editPostContent.value
        };

        localStorage.setItem("postDraft", JSON.stringify(draft));

        log("Draft autosaved");

        updatePreview();

      }, 800);

    });
  });
}

/* ================= UNDO (NEW) ================= */
window.undoUpdate = async () => {

  if (!lastSnapshot) {
    log("Nothing to undo", "warn");
    return;
  }

  const { id, data } = lastSnapshot;

  await updateDoc(doc(db, "posts", id), data);

  log("Undo successful");

};

/* ================= UPDATE POST ================= */
window.updatePost = async () => {

  const id = editPostId.value;

  const oldSnap = await getDoc(doc(db, "posts", id));
  lastSnapshot = { id, data: oldSnap.data() };

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

/* ================= FEATURED ORDER (NEW) ================= */
window.moveUp = async (id, order) => {

  await updateDoc(doc(db, "posts", id), {
    order: order - 1
  });

  log("Moved up");
};

window.moveDown = async (id, order) => {

  await updateDoc(doc(db, "posts", id), {
    order: order + 1
  });

  log("Moved down");
};

/* ================= DELETE ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("Deleted", "warn");
};

/* ================= USERS / ADS (UNCHANGED) ================= */
function loadUsers() { /* unchanged */ }
function loadAds() { /* unchanged */ }
function loadRejectedAds() { /* unchanged */ }

window.acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });
};

window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
};

window.clearRejected = async () => {

  const snap = await getDocs(collection(db, "adRequests"));

  const batch = writeBatch(db);

  snap.forEach(d => {
    if (d.data().status === "rejected") {
      batch.delete(d.ref);
    }
  });

  await batch.commit();

  log("Cleared");
};