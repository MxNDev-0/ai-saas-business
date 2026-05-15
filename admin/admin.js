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
   LOG SYSTEM
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
   CONTROL STATE
========================================= */

window.MCN_CONTROLS = {
  featuredPostId: null,
  sponsoredPostId: null,
  adsEnabled: true,
  discoverEnabled: true
};

/* =========================================
   CONTROL WATCHER
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
   ADMIN AUTH
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
   SAFE CONTROL
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
   CONTROL FUNCTIONS
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
   POSTS SYSTEM
========================================= */

let allPosts = [];

function loadPosts() {

  const box = document.getElementById("postsList");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {

    allPosts = [];
    box.innerHTML = "";

    snap.forEach(d => {
      allPosts.push({ id: d.id, ...d.data() });
    });

    window.renderPosts(allPosts);
  });
}

/* =========================================
   RENDER POSTS (FIXED GLOBAL)
========================================= */

window.renderPosts = function (posts) {

  const box = document.getElementById("postsList");
  if (!box) return;

  box.innerHTML = "";

  posts.forEach(p => {

    box.innerHTML += `
      <div class="item">

        <b>${p.title}</b><br>

        <button onclick='loadIntoEditor(${JSON.stringify(p)})'>
          Edit
        </button>

        <button onclick="deletePost('${p.id}')">
          Delete
        </button>

      </div>
    `;
  });
};

/* =========================================
   LOAD INTO EDITOR (INJECTED FIX)
========================================= */

window.loadIntoEditor = function (post) {

  if (!post) return;

  const idBox = document.getElementById("editPostId");
  const titleBox = document.getElementById("editPostTitle");
  const contentBox = document.getElementById("editPostContent");

  if (idBox) idBox.value = post.id || "";
  if (titleBox) titleBox.value = post.title || "";
  if (contentBox) contentBox.value = post.content || "";

  log("✏ Post loaded into editor: " + post.id);
};

/* =========================================
   UPDATE POST
========================================= */

window.updatePost = async function () {

  const id = document.getElementById("editPostId").value;
  if (!id) return log("No post selected", "warn");

  await updateDoc(doc(db, "posts", id), {
    title: document.getElementById("editPostTitle").value,
    content: document.getElementById("editPostContent").value,
    updatedAt: Date.now()
  });

  log("✏ Post updated: " + id);
};

/* =========================================
   DELETE POST
========================================= */

window.deletePost = async (id) => {

  await deleteDoc(doc(db, "posts", id));

  log("🗑 Deleted post: " + id);
};

/* =========================================
   ADS SYSTEM
========================================= */

function loadAds() {

  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach(d => {

      box.innerHTML += `
        <div class="item">
          <b>${d.data().title}</b><br>
          <button onclick="acceptAd('${d.id}')">Accept</button>
          <button onclick="rejectAd('${d.id}')">Reject</button>
        </div>
      `;
    });

  });
}

expose("loadAds", loadAds);

window.acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });
  log("✅ Ad accepted");
};

window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
  log("❌ Ad rejected");
};