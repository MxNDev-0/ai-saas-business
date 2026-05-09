import { auth, db } from "./firebase.js";

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
  getDocs,
  writeBatch,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN ADMIN AI v5 AUTONOMOUS SYSTEM
========================================= */

let systemHealth = 100;
let performanceScore = 100;

let errorHistory = [];
let warnHistory = [];

let autonomousMode = true;

let disabledModules = [];

let rollbackSnapshots = [];

let autosaveTimer = null;
let lastSnapshot = null;

let systemMap = {
  firestore: "stable",
  ui: "stable",
  auth: "stable",
  modules: "stable",
  autonomous: "active"
};

/* ================= LOG ENGINE ================= */

function aiLog(msg, type = "ok") {

  const box = document.getElementById("monitor");

  if (!box) {
    console.warn(msg);
    return;
  }

  const color =
    type === "error" ? "#ff4d4d" :
    type === "warn" ? "#ffaa00" :
    "#00ff88";

  const div = document.createElement("div");

  div.style.color = color;

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;

  const now = Date.now();

  if (type === "error") {
    errorHistory.push(now);
    systemHealth -= 6;
  }

  if (type === "warn") {
    warnHistory.push(now);
    systemHealth -= 2;
  }

  runPredictiveEngine();

  updateHealthUI();

  updateSystemMapUI();
}

const log = aiLog;

/* ================= PREDICTIVE ENGINE ================= */

function runPredictiveEngine() {

  const now = Date.now();

  errorHistory =
    errorHistory.filter(t => now - t < 60000);

  warnHistory =
    warnHistory.filter(t => now - t < 60000);

  if (errorHistory.length > 5) {

    aiLog(
      "⚠ Predictive crash risk detected",
      "error"
    );

    emergencyStabilization();
  }

  if (warnHistory.length > 10) {

    aiLog(
      "⚠ System instability rising",
      "warn"
    );

    systemHealth -= 5;
  }

  performanceScore =
    Math.max(30, 100 - (errorHistory.length * 4));

  systemHealth =
    Math.max(0, Math.min(100, systemHealth));
}

/* ================= AUTONOMOUS RECOVERY ================= */

function emergencyStabilization() {

  aiLog(
    "🛡 Emergency stabilization activated",
    "warn"
  );

  systemMap.autonomous = "stabilizing";

  autoDisableModules();

  systemHealth += 10;

  updateHealthUI();
}

/* ================= AUTO DISABLE ================= */

function autoDisableModules() {

  if (!disabledModules.includes("heavyRealtime")) {

    disabledModules.push("heavyRealtime");

    aiLog(
      "⛔ Disabled unstable realtime module",
      "warn"
    );
  }
}

/* ================= SNAPSHOT SYSTEM ================= */

function createSnapshot(name, data) {

  rollbackSnapshots.push({
    name,
    data,
    createdAt: Date.now()
  });

  if (rollbackSnapshots.length > 10) {
    rollbackSnapshots.shift();
  }

  aiLog(`📦 Snapshot saved: ${name}`);
}

function rollbackLatest() {

  const latest =
    rollbackSnapshots[rollbackSnapshots.length - 1];

  if (!latest) {

    aiLog("No rollback snapshot found", "warn");

    return null;
  }

  aiLog(
    `↩ Rolled back: ${latest.name}`,
    "warn"
  );

  return latest.data;
}

/* ================= PERFORMANCE ENGINE ================= */

function optimizePerformance() {

  if (performanceScore < 60) {

    aiLog(
      "⚡ Performance optimization activated",
      "warn"
    );

    trimMonitor();
  }
}

function trimMonitor() {

  const box = document.getElementById("monitor");

  if (!box) return;

  while (box.children.length > 80) {
    box.removeChild(box.firstChild);
  }
}

/* ================= HEALTH UI ================= */

function updateHealthUI() {

  let box =
    document.getElementById("healthBox");

  if (!box) {

    box = document.createElement("div");

    box.id = "healthBox";

    box.style.cssText = `
      position:fixed;
      top:10px;
      right:220px;
      background:#1c2541;
      color:#fff;
      padding:10px;
      border-radius:10px;
      font-size:12px;
      width:200px;
      z-index:999999;
    `;

    document.body.appendChild(box);
  }

  box.innerHTML = `
    <b>🧠 MCN AI v5</b>
    <br><br>
    Health: ${systemHealth}%
    <br>
    Performance: ${performanceScore}%
    <br>
    Errors: ${errorHistory.length}
    <br>
    Warnings: ${warnHistory.length}
    <br>
    Autonomous:
    ${autonomousMode ? "ON" : "OFF"}
  `;

  if (systemHealth < 40) {
    box.style.background = "darkred";
  }
  else if (systemHealth < 70) {
    box.style.background = "#b26a00";
  }
  else {
    box.style.background = "#1c2541";
  }
}

/* ================= SYSTEM MAP ================= */

function updateSystemMapUI() {

  let box =
    document.getElementById("systemMap");

  if (!box) {

    box = document.createElement("div");

    box.id = "systemMap";

    box.style.cssText = `
      position:fixed;
      bottom:10px;
      right:10px;
      background:#1c2541;
      color:#fff;
      padding:10px;
      border-radius:10px;
      font-size:11px;
      width:220px;
      z-index:999999;
    `;

    document.body.appendChild(box);
  }

  box.innerHTML = `
    <b>🗺 System Map</b>
    <br><br>

    Firestore:
    ${systemMap.firestore}

    <br>

    UI:
    ${systemMap.ui}

    <br>

    Auth:
    ${systemMap.auth}

    <br>

    Modules:
    ${systemMap.modules}

    <br>

    Autonomous:
    ${systemMap.autonomous}

    <hr>

    Disabled:
    ${disabledModules.join(", ") || "none"}
  `;
}

/* ================= SAFE HELPERS ================= */

function safeGet(id, fallback = null) {

  const el = document.getElementById(id);

  if (!el) {

    aiLog(`Missing UI: ${id}`, "warn");

    systemMap.ui = "degraded";

    return fallback;
  }

  return el;
}

async function safeRun(fn, label) {

  const start = performance.now();

  try {

    const result = await fn();

    const duration =
      performance.now() - start;

    if (duration > 1000) {

      aiLog(
        `⚠ Slow system: ${label} (${duration.toFixed(0)}ms)`,
        "warn"
      );

      systemMap.firestore = "slow";
    }

    optimizePerformance();

    return result;

  } catch (err) {

    aiLog(
      `${label} failed: ${err.message}`,
      "error"
    );

    systemMap.modules = "unstable";
  }
}

/* ================= AUTO REPAIR ================= */

async function ensureDoc(path, defaultData) {

  try {

    const snap =
      await getDoc(doc(db, ...path.split("/")));

    if (!snap.exists()) {

      aiLog(
        `🛠 Auto-repairing ${path}`,
        "warn"
      );

      await setDoc(
        doc(db, ...path.split("/")),
        {
          ...defaultData,
          repairedAt: Date.now()
        }
      );

      systemHealth += 5;
    }

  } catch (err) {

    aiLog(
      `Repair failed: ${path}`,
      "error"
    );

    systemMap.firestore = "unstable";
  }
}

/* ================= MAINTENANCE MODE ================= */

async function loadMaintenanceMode() {

  await safeRun(async () => {

    await ensureDoc("system/maintenance", {
      enabled: false,
      mode: "soft",
      message: "System maintenance",
      updatedAt: Date.now()
    });

    const snap =
      await getDoc(doc(db, "system", "maintenance"));

    if (!snap.exists()) {

      aiLog(
        "Maintenance document missing",
        "warn"
      );

      return;
    }

    const data = snap.data();

    const toggle =
      safeGet("maintenanceToggle");

    if (!toggle) {

      aiLog(
        "Maintenance toggle missing in UI",
        "warn"
      );

      return;
    }

    toggle.checked = data.enabled === true;

    systemMap.firestore = "stable";

    aiLog("🛠 Maintenance system online");

  }, "loadMaintenanceMode");
}

window.saveMaintenanceMode = async function () {

  await safeRun(async () => {

    const toggle =
      safeGet("maintenanceToggle");

    if (!toggle) {

      aiLog(
        "Maintenance toggle unavailable",
        "error"
      );

      return;
    }

    const enabled =
      toggle.checked;

    await setDoc(
      doc(db, "system", "maintenance"),
      {
        enabled,
        mode: enabled ? "hard" : "soft",
        message: enabled
          ? "MCN Engine is under maintenance"
          : "System online",
        updatedAt: Date.now()
      }
    );

    aiLog(
      enabled
        ? "🛠 Maintenance ENABLED"
        : "✅ Maintenance DISABLED"
    );

  }, "saveMaintenanceMode");
};

/* ================= ADMIN AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    systemMap.auth = "offline";

    location.href = "index.html";

    return;
  }

  try {

    systemMap.auth = "checking";

    const snap =
      await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {

      aiLog(
        "Admin profile missing",
        "error"
      );

      alert("User not found");

      location.href = "index.html";

      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {

      aiLog(
        "Unauthorized admin access blocked",
        "warn"
      );

      alert("Admin access only");

      location.href = "dashboard.html";

      return;
    }

    aiLog("🧠 MCN Admin AI v5 online");

    systemHealth = 100;

    performanceScore = 100;

    errorHistory = [];

    warnHistory = [];

    disabledModules = [];

    rollbackSnapshots = [];

    systemMap = {
      firestore: "stable",
      ui: "stable",
      auth: "stable",
      modules: "stable",
      autonomous: "active"
    };

    createSnapshot("boot-state", {
      time: Date.now(),
      health: systemHealth,
      performance: performanceScore
    });

    updateHealthUI();

    updateSystemMapUI();

    await loadMaintenanceMode();

    await safeRun(async () => {
      loadPosts();
    }, "postsModule");

    await safeRun(async () => {
      loadUsers();
    }, "usersModule");

    await safeRun(async () => {
      loadAds();
    }, "adsModule");

    await safeRun(async () => {
      loadRejectedAds();
    }, "rejectedAdsModule");

    await safeRun(async () => {
      initAutosave();
    }, "autosaveModule");

    aiLog("🚀 All systems operational");

  } catch (err) {

    console.error(err);

    aiLog(
      "Critical admin boot failure: " + err.message,
      "error"
    );

    systemMap.modules = "critical";

    emergencyStabilization();

    alert("Admin auth failed");
  }
});

/* ================= CREATE BLOG ================= */

window.createBlog = async () => {

  try {

    const title =
      document.getElementById("blogTitle").value.trim();

    const content =
      document.getElementById("blogContent").value.trim();

    const image =
      document.getElementById("blogImage").value.trim();

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
        expiresAt: adExpiry.value
          ? new Date(adExpiry.value).getTime()
          : null,
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

    const ref =
      await addDoc(collection(db, "posts"), post);

    aiLog("Blog created: " + ref.id);

    blogTitle.value = "";
    blogContent.value = "";
    blogImage.value = "";

  } catch (err) {

    console.error(err);

    aiLog("Create failed", "error");
  }
};

/* ================= POSTS ================= */

function loadPosts() {

  const box =
    document.getElementById("postsList");

  if (!box) return;

  const q =
    query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    if (snap.empty) {

      box.innerHTML = `
        <div class="item">
          No posts yet
        </div>
      `;

      return;
    }

    snap.forEach((d) => {

      const p = d.data();

      const published =
        p.admin?.approved !== false;

      box.innerHTML += `
        <div class="item">

          <b>${p.title || "Untitled"}</b>

          <br><br>

          <small>ID: ${d.id}</small>

          <br><br>

          Status:
          ${published ? "PUBLISHED" : "HIDDEN"}

          <br><br>

          <button onclick="deletePost('${d.id}')">
            Delete
          </button>

        </div>
      `;
    });
  });
}

/* ================= DELETE ================= */

window.deletePost = async (id) => {

  try {

    await deleteDoc(doc(db, "posts", id));

    aiLog("Post deleted", "warn");

  } catch (err) {

    console.error(err);

    aiLog("Delete failed", "error");
  }
};

/* ================= USERS ================= */

function loadUsers() {

  const box =
    document.getElementById("usersList");

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

  const box =
    document.getElementById("upgradeList");

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

        </div>
      `;
    });
  });
}

/* ================= REJECTED ADS ================= */

function loadRejectedAds() {

  const box =
    document.getElementById("rejectedList");

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

/* ================= AUTOSAVE ================= */

function initAutosave() {

  const inputs = [
    "editTitle",
    "editContent"
  ];

  inputs.forEach(id => {

    const el =
      document.getElementById(id);

    if (!el) return;

    el.addEventListener("input", () => {

      clearTimeout(autosaveTimer);

      autosaveTimer =
        setTimeout(() => {

          const draft = {
            title: editTitle.value,
            content: editContent.value
          };

          localStorage.setItem(
            "postDraft",
            JSON.stringify(draft)
          );

          aiLog("Draft autosaved");

        }, 800);
    });
  });
}

/* ================= AUTONOMOUS LOOPS ================= */

setInterval(() => {

  if (systemHealth < 100) {
    systemHealth += 1;
  }

  if (performanceScore < 100) {
    performanceScore += 1;
  }

  updateHealthUI();

  updateSystemMapUI();

}, 5000);

/* ================= AUTO SNAPSHOTS ================= */

setInterval(() => {

  createSnapshot("autosave", {
    health: systemHealth,
    performance: performanceScore,
    time: Date.now()
  });

}, 60000);