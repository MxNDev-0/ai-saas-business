/* =========================================
   MCN ADMIN AI v5
========================================= */

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

/* ================= SYSTEM STATE ================= */

let systemHealth = 100;
let performanceScore = 100;

let errorHistory = [];
let warnHistory = [];

let autonomousMode = true;

let disabledModules = [];

let rollbackSnapshots = [];

let autosaveTimer = null;

let systemMap = {
  firestore: "stable",
  ui: "stable",
  auth: "stable",
  modules: "stable",
  autonomous: "active"
};

/* ================= LOG ENGINE ================= */

function aiLog(msg, type = "ok") {

  const box =
    document.getElementById("monitor");

  if (!box) {
    console.warn(msg);
    return;
  }

  const color =
    type === "error"
      ? "#ff4d4d"
      : type === "warn"
      ? "#ffaa00"
      : "#00ff88";

  const div =
    document.createElement("div");

  div.style.color = color;

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;

  if (type === "error") {
    errorHistory.push(Date.now());
    systemHealth -= 5;
  }

  if (type === "warn") {
    warnHistory.push(Date.now());
    systemHealth -= 2;
  }

  updateHealthUI();
  updateSystemMapUI();
}

const log = aiLog;

/* ================= HEALTH UI ================= */

function updateHealthUI() {

  let panel =
    document.getElementById("mcnHealthPanel");

  if (!panel) {

    panel = document.createElement("div");

    panel.id = "mcnHealthPanel";

    panel.style.cssText = `
      position:fixed;
      top:10px;
      right:10px;
      width:55px;
      background:#1c2541;
      color:#fff;
      border-radius:12px;
      overflow:hidden;
      z-index:999999;
      box-shadow:0 0 20px rgba(0,0,0,0.4);
      transition:all 0.3s ease;
      font-family:Arial;
    `;

    panel.innerHTML = `

      <div id="mcnMiniBtn"
        style="
          padding:12px;
          text-align:center;
          cursor:pointer;
          font-size:20px;
          background:#0b132b;
        ">
        🧠
      </div>

      <div id="mcnHealthContent"
        style="
          display:none;
          padding:12px;
          font-size:12px;
          line-height:1.7;
        ">
      </div>
    `;

    document.body.appendChild(panel);

    const miniBtn =
      document.getElementById("mcnMiniBtn");

    const content =
      document.getElementById("mcnHealthContent");

    let expanded = false;

    miniBtn.onclick = () => {

      expanded = !expanded;

      if (expanded) {

        panel.style.width = "220px";

        content.style.display = "block";

      } else {

        panel.style.width = "55px";

        content.style.display = "none";
      }
    };
  }

  const content =
    document.getElementById("mcnHealthContent");

  if (!content) return;

  content.innerHTML = `

    <b>🧠 MCN AI v5</b>

    <hr style="border:0;border-top:1px solid #444">

    Health:
    ${systemHealth}%

    <br>

    Performance:
    ${performanceScore}%

    <br>

    Errors:
    ${errorHistory.length}

    <br>

    Warnings:
    ${warnHistory.length}

    <br>

    Autonomous:
    ${autonomousMode ? "ON" : "OFF"}

  `;
}

/* ================= SYSTEM MAP ================= */

function updateSystemMapUI() {

  let panel =
    document.getElementById("mcnSystemMap");

  if (!panel) {

    panel = document.createElement("div");

    panel.id = "mcnSystemMap";

    panel.style.cssText = `
      position:fixed;
      bottom:10px;
      right:10px;
      width:55px;
      background:#1c2541;
      color:#fff;
      border-radius:12px;
      overflow:hidden;
      z-index:999999;
      box-shadow:0 0 20px rgba(0,0,0,0.4);
      transition:all 0.3s ease;
      font-family:Arial;
    `;

    panel.innerHTML = `

      <div id="mapMiniBtn"
        style="
          padding:12px;
          text-align:center;
          cursor:pointer;
          font-size:18px;
          background:#0b132b;
        ">
        🗺
      </div>

      <div id="mapContent"
        style="
          display:none;
          padding:12px;
          font-size:11px;
          line-height:1.7;
        ">
      </div>
    `;

    document.body.appendChild(panel);

    const miniBtn =
      document.getElementById("mapMiniBtn");

    const content =
      document.getElementById("mapContent");

    let expanded = false;

    miniBtn.onclick = () => {

      expanded = !expanded;

      if (expanded) {

        panel.style.width = "240px";

        content.style.display = "block";

      } else {

        panel.style.width = "55px";

        content.style.display = "none";
      }
    };
  }

  const content =
    document.getElementById("mapContent");

  if (!content) return;

  content.innerHTML = `

    <b>🗺 System Map</b>

    <hr style="border:0;border-top:1px solid #444">

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

    <br>

    Disabled:
    ${disabledModules.join(", ") || "none"}

  `;
}

/* ================= MAINTENANCE ================= */

async function loadMaintenanceMode() {

  try {

    const snap =
      await getDoc(
        doc(db, "system", "maintenance")
      );

    if (!snap.exists()) {

      await setDoc(
        doc(db, "system", "maintenance"),
        {
          enabled: false,
          updatedAt: Date.now()
        }
      );
    }

    const data =
      snap.exists()
        ? snap.data()
        : { enabled: false };

    const toggle =
      document.getElementById(
        "maintenanceToggle"
      );

    if (toggle) {
      toggle.checked = data.enabled === true;
    }

    aiLog("🛠 Maintenance system online");

  } catch (err) {

    console.error(err);

    aiLog(
      "Maintenance load failed",
      "error"
    );
  }
}

window.saveMaintenanceMode = async function () {

  try {

    const toggle =
      document.getElementById(
        "maintenanceToggle"
      );

    if (!toggle) {

      aiLog(
        "Maintenance toggle missing",
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
        updatedAt: Date.now()
      },
      { merge: true }
    );

    aiLog(
      enabled
        ? "🛠 Maintenance ENABLED"
        : "✅ Maintenance DISABLED"
    );

  } catch (err) {

    console.error(err);

    aiLog(
      "Maintenance save failed: " +
      err.message,
      "error"
    );
  }
};

/* ================= ADMIN AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "index.html";

    return;
  }

  try {

    const snap =
      await getDoc(
        doc(db, "users", user.uid)
      );

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

    aiLog("🧠 MCN Admin AI v5 online");

    loadMaintenanceMode();

    loadPosts();

    loadUsers();

    loadAds();

    loadRejectedAds();

    initAutosave();

  } catch (err) {

    console.error(err);

    aiLog(
      "Admin boot failed",
      "error"
    );
  }
});

/* ================= POSTS ================= */

window.createBlog = async function () {

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

    await addDoc(
      collection(db, "posts"),
      {
        title,
        content,
        image,
        createdAt: serverTimestamp()
      }
    );

    aiLog("Blog created");

  } catch (err) {

    console.error(err);

    aiLog(
      "Create failed",
      "error"
    );
  }
};

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

    snap.forEach((d) => {

      const p = d.data();

      box.innerHTML += `
        <div class="item">

          <b>${p.title || "Untitled"}</b>

          <br><br>

          <button onclick="deletePost('${d.id}')">
            Delete
          </button>

        </div>
      `;
    });
  });
}

window.deletePost = async function (id) {

  try {

    await deleteDoc(
      doc(db, "posts", id)
    );

    aiLog("Post deleted");

  } catch (err) {

    console.error(err);

    aiLog(
      "Delete failed",
      "error"
    );
  }
};

/* ================= USERS ================= */

function loadUsers() {

  const box =
    document.getElementById("usersList");

  if (!box) return;

  onSnapshot(
    collection(db, "users"),
    (snap) => {

      box.innerHTML = "";

      snap.forEach((d) => {

        const u = d.data();

        box.innerHTML += `
          <div class="item">
            ${u.email || "Unknown User"}
          </div>
        `;
      });
    }
  );
}

/* ================= ADS ================= */

function loadAds() {

  const box =
    document.getElementById("upgradeList");

  if (!box) return;

  onSnapshot(
    collection(db, "adRequests"),
    (snap) => {

      box.innerHTML = "";

      snap.forEach((d) => {

        const ad = d.data();

        box.innerHTML += `
          <div class="item">

            <b>${ad.title || "Ad Request"}</b>

            <br><br>

            Status:
            ${ad.status || "pending"}

          </div>
        `;
      });
    }
  );
}

/* ================= REJECTED ADS ================= */

function loadRejectedAds() {

  const box =
    document.getElementById("rejectedList");

  if (!box) return;

  onSnapshot(
    collection(db, "adRequests"),
    (snap) => {

      box.innerHTML = "";

      snap.forEach((d) => {

        const ad = d.data();

        if (ad.status !== "rejected") return;

        box.innerHTML += `
          <div class="item">
            ${ad.title || "Rejected"}
          </div>
        `;
      });
    }
  );
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

          localStorage.setItem(
            "mcnDraft",
            JSON.stringify({
              title: editTitle.value,
              content: editContent.value
            })
          );

          aiLog("Draft autosaved");

        }, 800);
    });
  });
}