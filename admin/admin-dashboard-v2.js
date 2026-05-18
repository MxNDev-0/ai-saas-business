/* =========================================
   🚀 MCN ADMIN DASHBOARD v2
   CONTROL LAYER UI CONNECTOR
========================================= */

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= INIT ================= */

export function startAdminDashboardV2() {

  initPostsPanel();
  initAdsPanel();
  initSupportPanel();
  initSystemPanel();

  console.log("🧠 ADMIN DASHBOARD v2 ONLINE");
}

/* ================= POSTS PANEL ================= */

function initPostsPanel() {

  const ref = collection(db, "posts");

  onSnapshot(ref, snap => {

    const box = document.getElementById("dashPosts");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      const div = document.createElement("div");
      div.className = "dashItem";

      div.innerHTML = `
        <b>${p.title}</b>
        <small>${(p.content || "").slice(0, 50)}...</small>

        <button onclick="MCN.editPost('${d.id}')">Edit</button>
        <button style="background:red;color:white"
          onclick="MCN.removePost('${d.id}')">Delete</button>
      `;

      box.appendChild(div);
    });

  });
}

/* ================= ADS PANEL ================= */

function initAdsPanel() {

  const ref = collection(db, "adRequests");

  onSnapshot(ref, snap => {

    const pending = document.getElementById("dashAdsPending");
    if (!pending) return;

    pending.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      if (ad.status !== "pending") return;

      const div = document.createElement("div");
      div.className = "dashItem";

      div.innerHTML = `
        <b>${ad.title}</b>
        <small>${ad.text}</small>

        <button onclick="MCN.approveAd('${d.id}')">Approve</button>
        <button style="background:red;color:white"
          onclick="MCN.rejectAd('${d.id}')">Reject</button>
      `;

      pending.appendChild(div);
    });

  });
}

/* ================= SUPPORT PANEL ================= */

function initSupportPanel() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, snap => {

    const box = document.getElementById("dashChats");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {

      const div = document.createElement("div");
      div.className = "dashItem";

      div.innerHTML = `
        💬 ${d.id}
        <button onclick="MCN.openChat('${d.id}')">Open</button>
      `;

      box.appendChild(div);
    });

  });
}

/* ================= SYSTEM PANEL ================= */

function initSystemPanel() {

  const box = document.getElementById("dashSystem");
  if (!box) return;

  setInterval(() => {

    const s = window.MCN_SYSTEM || {};

    box.innerHTML = `
      <div class="dashItem">
        <b>System Health:</b> ${s.health || 0}
      </div>

      <div class="dashItem">
        Posts: ${s.stats?.posts || 0}
      </div>

      <div class="dashItem">
        Users: ${s.stats?.users || 0}
      </div>

      <div class="dashItem">
        Support Chats: ${s.stats?.supportChats || 0}
      </div>

      <div class="dashItem">
        Last Event: ${s.stats?.lastEvent || "none"}
      </div>
    `;

  }, 2000);
}

/* ================= GLOBAL API ================= */

window.MCN_DASH = {
  startAdminDashboardV2
};