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

/* ================= MCN ADMIN AI v3 CORE ================= */

let systemHealth = 100;
let errorCount = 0;
let warningCount = 0;

function aiLog(msg, type = "ok") {

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

  if (type === "error") {
    errorCount++;
    systemHealth -= 8;
  }

  if (type === "warn") {
    warningCount++;
    systemHealth -= 2;
  }

  updateHealthUI();
}

const log = aiLog;

/* ================= HEALTH UI ================= */
function updateHealthUI() {

  let box = document.getElementById("healthBox");

  if (!box) {

    box = document.createElement("div");

    box.id = "healthBox";

    box.style.cssText = `
      position:fixed;
      top:10px;
      right:10px;
      background:#1c2541;
      color:#fff;
      padding:10px;
      border-radius:8px;
      font-size:12px;
      z-index:999999;
      width:180px;
    `;

    document.body.appendChild(box);
  }

  systemHealth = Math.max(0, Math.min(100, systemHealth));

  box.innerHTML = `
    <b>🧠 MCN AI Health</b><br><br>
    Health: ${systemHealth}%<br>
    Errors: ${errorCount}<br>
    Warnings: ${warningCount}
  `;

  if (systemHealth < 40) {
    box.style.background = "darkred";
  } else if (systemHealth < 70) {
    box.style.background = "orange";
  } else {
    box.style.background = "#1c2541";
  }
}

/* ================= SAFE GET ================= */
function safeGet(id, fallback = null) {

  const el = document.getElementById(id);

  if (!el) {
    aiLog(`Missing UI: ${id}`, "warn");
    return fallback;
  }

  return el;
}

/* ================= AUTO REPAIR FIRESTORE ================= */
async function ensureDoc(path, defaultData) {

  try {

    const snap = await getDoc(doc(db, ...path.split("/")));

    if (!snap.exists()) {

      aiLog(`Auto-repair: ${path}`, "warn");

      await setDoc(doc(db, ...path.split("/")), {
        ...defaultData,
        repairedAt: Date.now()
      });

      systemHealth += 5;
    }

  } catch (err) {
    aiLog(`Repair failed: ${path}`, "error");
  }
}

/* ================= SAFE RUN ================= */
async function safeRun(fn, label) {

  try {
    return await fn();
  } catch (err) {
    console.error(err);
    aiLog(`${label} failed: ${err.message}`, "error");
  }
}

/* ================= STATE ================= */
let lastSnapshot = null;
let autosaveTimer = null;

/* ================= MAINTENANCE MODE ================= */
async function loadMaintenanceMode() {

  await safeRun(async () => {

    await ensureDoc("system/maintenance", {
      enabled: false,
      mode: "soft",
      message: "System maintenance"
    });

    const snap = await getDoc(doc(db, "system", "maintenance"));

    const data = snap.data();

    const toggle = safeGet("maintenanceToggle");

    if (toggle) {
      toggle.checked = data.enabled === true;
    }

    aiLog("Maintenance loaded");

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

    aiLog(enabled ? "Maintenance enabled" : "Maintenance disabled");

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

    aiLog("Admin online");

    systemHealth = 100;
    errorCount = 0;
    warningCount = 0;

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
      metrics: { impressions: 0, clicks: 0 },
      admin: { approved: true },
      order: 0
    };

    const ref = await addDoc(collection(db, "posts"), post);

    aiLog("Blog created: " + ref.id);

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

        </div>
      `;
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

  aiLog("Cleared rejected ads");
};