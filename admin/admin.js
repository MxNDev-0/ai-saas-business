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
   SAFE CONTROL WRAPPER
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

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Deleted");
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

/* =========================================
   🔥 COMMAND TERMINAL V6 (FIXED INTEGRATION)
========================================= */

const commandHistory = [];

/* BOOT LOGS */
log("⌨ Command Terminal V6 loading...");
setTimeout(() => log("🧠 Parsing command engine ready"), 600);
setTimeout(() => log("📡 Secure admin command layer active"), 1200);

/* COMMAND LOG */
function logCommand(cmd, result) {
  commandHistory.unshift({
    cmd,
    result,
    time: new Date().toLocaleTimeString()
  });

  if (commandHistory.length > 20) commandHistory.pop();
}

/* RENDER TERMINAL */
function renderTerminal() {
  const box = document.getElementById("cmdOutput");
  if (!box) return;

  box.innerHTML = "";

  commandHistory.forEach(c => {
    box.innerHTML += `
      <div class="item">
        <b>${c.cmd}</b><br>
        <small>${c.time}</small><br>
        <span>${c.result}</span>
      </div>
    `;
  });
}

/* COMMAND ENGINE */
window.runCommand = async function () {

  const input = document.getElementById("cmdInput");
  const raw = input.value.trim();

  if (!raw.startsWith("/")) {
    log("Invalid command format", "warn");
    return;
  }

  const parts = raw.split(" ");
  const cmd = parts[0].toLowerCase();

  let result = "Unknown command";

  try {

    if (cmd === "/ads") {
      if (parts[1] === "off") {
        await safeControl("adsEnabled", false);
        result = "Ads disabled";
      } else if (parts[1] === "on") {
        await safeControl("adsEnabled", true);
        result = "Ads enabled";
      }
    }

    else if (cmd === "/discover") {
      if (parts[1] === "off") {
        await safeControl("discoverEnabled", false);
        result = "Discover disabled";
      } else if (parts[1] === "on") {
        await safeControl("discoverEnabled", true);
        result = "Discover enabled";
      }
    }

    else if (cmd === "/feature") {
      await safeControl("featuredPostId", parts[1]);
      result = `Featured set: ${parts[1]}`;
    }

    else if (cmd === "/sponsor") {
      await safeControl("sponsoredPostId", {
        id: parts[1],
        slot: parts[2] || "feed"
      });
      result = "Sponsored updated";
    }

    else if (cmd === "/status") {
      const c = window.MCN_CONTROLS;
      result = `ADS:${c.adsEnabled} DISC:${c.discoverEnabled}`;
    }

    else {
      result = "Unknown command";
    }

    logCommand(raw, result);
    renderTerminal();
    log("⌨ " + raw);

  } catch (err) {
    console.error(err);
    result = "Command failed";
    logCommand(raw, result);
    renderTerminal();
  }

  input.value = "";
};