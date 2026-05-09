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
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */
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

/* ================= MAINTENANCE MODE ================= */
async function loadMaintenanceMode() {

  try {

    const snap = await getDoc(doc(db, "system", "maintenance"));
    if (!snap.exists()) return;

    const data = snap.data();

    const toggle = document.getElementById("maintenanceToggle");

    if (!toggle) {
      log("Maintenance toggle not found", "warn");
      return;
    }

    toggle.checked = data.enabled === true;

  } catch (err) {

    console.error(err);
    log("Maintenance load failed", "error");
  }
}

window.saveMaintenanceMode = async function () {

  try {

    const toggle = document.getElementById("maintenanceToggle");

    if (!toggle) {
      log("Toggle missing", "error");
      return;
    }

    const enabled = toggle.checked;

    await setDoc(doc(db, "system", "maintenance"), {
      enabled,
      updatedAt: Date.now()
    });

    log(enabled ? "Maintenance enabled" : "Maintenance disabled");

  } catch (err) {

    console.error(err);
    log("Maintenance save failed", "error");
  }
};

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

    loadMaintenanceMode(); // ✅ FIXED POSITION

    loadPosts();
    loadUsers();
    loadAds();
    loadRejectedAds();

    initAutosave();

  } catch (err) {

    console.error(err);
    alert("Admin auth failed");
  }
});

/* ================= CREATE BLOG ================= */
window.createBlog = async () => {

  try {

    const title = document.getElementById("blogTitle").value.trim();
    const content = document.getElementById("blogContent").value.trim();
    const image = document.getElementById("blogImage").value.trim();

    if (!title || !content) {
      alert("Title and content required");
      return;
    }

    const post = {

      title,
      content,
      image,

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

      placeholder: {
        slot: placeholderSlot.value || "",
        text: placeholderText.value || ""
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

    blogTitle.value = "";
    blogContent.value = "";
    blogImage.value = "";

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

    if (snap.empty) {
      box.innerHTML = `<div class="item">No posts yet</div>`;
      return;
    }

    snap.forEach((d) => {

      const p = d.data();
      const published = p.admin?.approved !== false;

      box.innerHTML += `
        <div class="item">

          <b>${p.title || "Untitled"}</b>

          <br><br>

          <small>ID: ${d.id}</small>

          <br><br>

          Status: ${published ? "PUBLISHED" : "HIDDEN"}

          <br><br>

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

/* ================= AUTOSAVE ================= */
function initAutosave() {

  const inputs = ["editPostTitle", "editPostContent"];

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

/* ================= USERS ================= */
function loadUsers() {

  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "users"), (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {

      const u = d.data();

      box.innerHTML += `
        <div class="item">
          ${u.email || "Unknown User"}
        </div>
      `;
    });
  });
}

/* ================= ADS ================= */
function loadAds() {

  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {

      const ad = d.data();

      box.innerHTML += `
        <div class="item">

          <b>${ad.title || "Ad Request"}</b>

          <br><br>

          Status: ${ad.status || "pending"}

          <br><br>

          <button onclick="acceptAd('${d.id}')">Accept</button>
          <button onclick="rejectAd('${d.id}')">Reject</button>

        </div>
      `;
    });
  });
}

/* ================= REJECTED ADS ================= */
function loadRejectedAds() {

  const box = document.getElementById("rejectedList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {

      const ad = d.data();

      if (ad.status !== "rejected") return;

      box.innerHTML += `
        <div class="item">
          ${ad.title || "Rejected Ad"}
        </div>
      `;
    });
  });
}

/* ================= ACCEPT / REJECT ================= */
window.acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });
};

window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
};

/* ================= CLEAR REJECTED ================= */
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