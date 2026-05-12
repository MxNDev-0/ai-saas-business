/* =========================================
   MCN ADMIN AI v6 — CORE CONTROL EDITION
   (Upgraded: Auth + Emergency + Diagnostics)
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   SYSTEM CORE STATE
========================================= */

let systemHealth = 100;
let performanceScore = 100;

let errorHistory = [];
let warnHistory = [];

let emergencyMode = false;
let autonomousMode = true;

let autosaveTimer = null;

let systemMap = {
  firestore: "stable",
  ui: "stable",
  auth: "stable",
  modules: "stable",
  emergency: "inactive"
};

/* =========================================
   LOG ENGINE
========================================= */

function aiLog(msg, type = "ok") {

  const box = document.getElementById("monitor");
  if (!box) return console.warn(msg);

  const color =
    type === "error" ? "#ff4d4d" :
    type === "warn" ? "#ffaa00" :
    "#00ff88";

  const div = document.createElement("div");

  div.style.color = color;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;

  if (type === "error") systemHealth -= 5;
  if (type === "warn") systemHealth -= 2;

  updateHealthUI();
  updateSystemMapUI();
}

/* =========================================
   AUTH LAYER (ADMIN LOCK)
========================================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  try {

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      location.href = "index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      location.href = "dashboard.html";
      return;
    }

    aiLog("🧠 Admin Core Activated");

    loadMaintenanceMode();
    loadPosts();
    loadUsers();
    loadAds();

    initDiagnostics();
    initEmergencyListener();

  } catch (err) {
    console.error(err);
    aiLog("Auth failure", "error");
  }
});

/* =========================================
   MAINTENANCE CONTROL
========================================= */

window.saveMaintenanceMode = async function () {

  const toggle = document.getElementById("maintenanceToggle");
  if (!toggle) return;

  const enabled = toggle.checked;

  await setDoc(doc(db, "system", "maintenance"), {
    enabled,
    updatedAt: Date.now()
  }, { merge: true });

  aiLog(
    enabled
      ? "🛠 Maintenance ENABLED"
      : "✅ Maintenance DISABLED"
  );
};

async function loadMaintenanceMode() {

  const snap = await getDoc(doc(db, "system", "maintenance"));

  if (!snap.exists()) {
    await setDoc(doc(db, "system", "maintenance"), {
      enabled: false
    });
  }

  const data = snap.exists() ? snap.data() : { enabled: false };

  const toggle = document.getElementById("maintenanceToggle");
  if (toggle) toggle.checked = data.enabled;
}

/* =========================================
   🚨 EMERGENCY CONTROL SYSTEM
========================================= */

function initEmergencyListener() {

  window.triggerEmergencyShutdown = async function () {

    emergencyMode = true;

    systemMap.emergency = "ACTIVE";

    aiLog("🚨 EMERGENCY MODE ACTIVATED", "error");

    await setDoc(doc(db, "system", "emergency"), {
      enabled: true,
      timestamp: Date.now()
    });

    document.body.style.filter = "grayscale(1) brightness(0.6)";

  };

  window.disableEmergency = async function () {

    emergencyMode = false;

    systemMap.emergency = "inactive";

    aiLog("🟢 Emergency mode OFF");

    await setDoc(doc(db, "system", "emergency"), {
      enabled: false,
      timestamp: Date.now()
    });

    document.body.style.filter = "none";
  };
}

/* =========================================
   SYSTEM DIAGNOSTICS (MOBILE FRIENDLY)
========================================= */

function initDiagnostics() {

  const panel = document.createElement("div");

  panel.id = "mobileDiag";

  panel.style.cssText = `
    position:fixed;
    bottom:70px;
    left:10px;
    background:#1c2541;
    color:#fff;
    padding:10px;
    border-radius:10px;
    font-size:12px;
    z-index:99999;
    max-width:180px;
  `;

  panel.innerHTML = `
    <b>📡 Diagnostics</b><br>
    Health: ${systemHealth}%<br>
    Mode: ${emergencyMode ? "EMERGENCY" : "NORMAL"}
  `;

  document.body.appendChild(panel);
}

/* =========================================
   UI SYSTEMS (UNCHANGED CORE)
========================================= */

function updateHealthUI() {
  let panel = document.getElementById("mcnHealthPanel");
  if (!panel) return;

  const content = document.getElementById("mcnHealthContent");
  if (!content) return;

  content.innerHTML = `
    <b>MCN AI Core</b><br><hr>
    Health: ${systemHealth}%<br>
    Performance: ${performanceScore}%<br>
    Errors: ${errorHistory.length}<br>
    Emergency: ${emergencyMode ? "YES" : "NO"}
  `;
}

function updateSystemMapUI() {
  let panel = document.getElementById("mcnSystemMap");
  if (!panel) return;

  const content = document.getElementById("mapContent");
  if (!content) return;

  content.innerHTML = `
    <b>System Map</b><br><hr>
    Firestore: ${systemMap.firestore}<br>
    UI: ${systemMap.ui}<br>
    Auth: ${systemMap.auth}<br>
    Emergency: ${systemMap.emergency}
  `;
}

/* =========================================
   POSTS / USERS / ADS (UNCHANGED CORE)
========================================= */

window.createBlog = async function () {
  const title = document.getElementById("blogTitle").value;
  const content = document.getElementById("blogContent").value;

  if (!title || !content) return;

  await addDoc(collection(db, "posts"), {
    title,
    content,
    createdAt: serverTimestamp()
  });

  aiLog("Post created");
};

function loadPosts() {

  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {

      const p = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${p.title}</b><br><br>
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.deletePost = async function (id) {
  await deleteDoc(doc(db, "posts", id));
  aiLog("Post deleted");
};

function loadUsers() {

  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "users"), (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {
      box.innerHTML += `<div class="item">${d.data().email}</div>`;
    });
  });
}

function loadAds() {

  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach((d) => {

      box.innerHTML += `
        <div class="item">
          ${d.data().title || "Ad"}
        </div>
      `;
    });
  });
}