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

/* ================= STABILITY CORE v2 ================= */

function safeLog(msg, type = "ok") {

  const box = document.getElementById("monitor");

  if (!box) {
    console.warn("[MONITOR MISSING]", msg);
    return;
  }

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

const log = safeLog;

/* SAFE DOM GET */
function safeGet(id) {

  const el = document.getElementById(id);

  if (!el) {
    safeLog(`Missing UI element: ${id}`, "warn");
  }

  return el;
}

/* SAFE RUN WRAPPER */
async function safeRun(fn, label) {

  try {
    return await fn();

  } catch (err) {

    console.error(err);
    safeLog(`${label} failed: ${err.message}`, "error");
  }
}

/* ================= STATE ================= */
let lastSnapshot = null;
let autosaveTimer = null;

/* ================= MAINTENANCE MODE ================= */

async function loadMaintenanceMode() {

  await safeRun(async () => {

    const snap = await getDoc(doc(db, "system", "maintenance"));

    if (!snap.exists()) {

      safeLog("Maintenance doc missing → creating default", "warn");

      await setDoc(doc(db, "system", "maintenance"), {
        enabled: false,
        mode: "soft",
        message: "System maintenance",
        updatedAt: Date.now()
      });

      return;
    }

    const data = snap.data();

    const toggle = safeGet("maintenanceToggle");

    if (toggle) {
      toggle.checked = data.enabled === true;
    }

  }, "loadMaintenanceMode");
}

window.saveMaintenanceMode = async function () {

  await safeRun(async () => {

    const toggle = safeGet("maintenanceToggle");

    const enabled = toggle ? toggle.checked : false;

    await setDoc(doc(db, "system", "maintenance"), {
      enabled,
      updatedAt: Date.now()
    });

    safeLog(enabled ? "Maintenance enabled" : "Maintenance disabled");

  }, "saveMaintenanceMode");
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

    safeLog("Admin online");

    loadMaintenanceMode();

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

  await safeRun(async () => {

    const title = safeGet("blogTitle")?.value?.trim();
    const content = safeGet("blogContent")?.value?.trim();
    const image = safeGet("blogImage")?.value?.trim();

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

    safeLog("Blog created: " + ref.id);

    blogTitle.value = "";
    blogContent.value = "";
    blogImage.value = "";

  }, "createBlog");
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

        safeLog("Draft autosaved");

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

/* ================= ACTIONS ================= */
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

  safeLog("Cleared rejected ads");
};