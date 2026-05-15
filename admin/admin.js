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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { watchControls, setControl } from "./admin-control.js";
import { initAdminGuard } from "./admin-auth.js";

/* =========================================
   GLOBAL EXPOSE
========================================= */

const expose = (name, fn) => {
  window[name] = fn;
};

/* =========================================
   LOG SYSTEM (SAFE)
========================================= */

function log(msg, type = "ok") {

  const box = document.getElementById("monitor");
  if (!box) return;

  const div = document.createElement("div");

  div.style.color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    "#00ff88";

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* =========================================
   CONTROL STATE (SAFE INIT)
========================================= */

window.MCN_CONTROLS = {
  featuredPostId: null,
  sponsoredPostId: null,
  adsEnabled: true,
  discoverEnabled: true
};

/* =========================================
   CONTROL WATCHER (REALTIME SAFE)
========================================= */

watchControls((data = {}) => {

  window.MCN_CONTROLS = {
    featuredPostId: data.featuredPostId ?? null,
    sponsoredPostId: data.sponsoredPostId ?? null,
    adsEnabled: data.adsEnabled ?? true,
    discoverEnabled: data.discoverEnabled ?? true
  };

  log("📡 Control system synced");
});

/* =========================================
   ADMIN AUTH (ANTI SPOOF CORE)
========================================= */

initAdminGuard((user) => {

  log("✅ Secure admin verified");

  window.MCN_READY = true;
  window.MCN_ADMIN = user;

  loadPosts();
  loadAds();
  loadRejectedAds();
});

/* =========================================
   CONTROL SAFE WRAPPER (FIX CORE BUGS)
========================================= */

async function safeControl(key, value) {
  try {
    await setControl(key, value);
    log(`⚙ ${key} updated`);
  } catch (err) {
    console.error(err);
    log("Control update failed", "error");
  }
}

/* =========================================
   CONTROL FUNCTIONS (FIXED + GLOBAL)
========================================= */

window.setFeatured = async () => {

  const id = document.getElementById("featurePostId")?.value;
  if (!id) return log("Missing featured ID", "warn");

  await safeControl("featuredPostId", id);
};

window.setSponsored = async () => {

  const id = document.getElementById("sponsorPostId")?.value;
  const slot = document.getElementById("sponsorSlot")?.value;

  if (!id) return log("Missing sponsor ID", "warn");

  await safeControl("sponsoredPostId", { id, slot });
};

window.toggleAds = async () => {

  const current = window.MCN_CONTROLS?.adsEnabled ?? true;
  await safeControl("adsEnabled", !current);
};

window.toggleDiscover = async () => {

  const current = window.MCN_CONTROLS?.discoverEnabled ?? true;
  await safeControl("discoverEnabled", !current);
};

/* =========================================
   CONTROL REFRESH FIX
========================================= */

window.refreshSystem = () => {

  log("🔄 System refreshed");

  const box = document.getElementById("controlStatus");
  if (!box) return;

  const c = window.MCN_CONTROLS || {};

  box.innerHTML = `
    <div class="item">🧠 SYSTEM ONLINE</div>
    <div class="item">⭐ FEATURED: ${c.featuredPostId || "None"}</div>
    <div class="item">💰 SPONSORED: ${c.sponsoredPostId?.id || "None"} (${c.sponsoredPostId?.slot || "-"})</div>
    <div class="item">📢 ADS: ${c.adsEnabled ? "ON" : "OFF"}</div>
    <div class="item">🔍 DISCOVER: ${c.discoverEnabled ? "ON" : "OFF"}</div>
  `;
};

/* =========================================
   OPTIONAL POST SYSTEM (UNCHANGED SAFE)
========================================= */

let allPosts = [];

function loadPosts() {

  const box = document.getElementById("postsList");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {

    allPosts = [];
    box.innerHTML = "";

    snap.forEach(d => allPosts.push({ id: d.id, ...d.data() }));

    renderPosts(allPosts);
  });
}

function renderPosts(posts) {

  const box = document.getElementById("postsList");
  box.innerHTML = "";

  posts.forEach(p => {

    box.innerHTML += `
      <div class="item">
        <b>${p.title}</b><br>

        <button onclick="deletePost('${p.id}')">Delete</button>
      </div>
    `;
  });
}

expose("loadPosts", loadPosts);

/* DELETE SAFE */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Deleted");
};