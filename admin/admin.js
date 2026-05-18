/* =========================================
   🚀 MCN ADMIN PRO MODE ENGINE v3
   FULL CONTROL SYSTEM (STABLE)
========================================= */

import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL STATE ================= */

window.MCN_STATE = {
  posts: [],
  chats: {},
  ads: [],
  selectedUser: null
};

/* ================= HELPERS ================= */

const el = (id) => document.getElementById(id);

/* ================= POSTS ================= */

function initPosts() {

  const qRef = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(qRef, snap => {

    const posts = [];

    snap.forEach(d => posts.push({ id: d.id, ...d.data() }));

    window.MCN_STATE.posts = posts;

    renderPosts();
    renderDashboard();
  });
}

function renderPosts() {

  const box = el("postsList");
  const dash = el("dashPosts");

  if (box) box.innerHTML = "";
  if (dash) dash.innerHTML = "";

  window.MCN_STATE.posts.forEach(p => {

    const html = `
      <div class="dashItem">
        <input id="t-${p.id}" value="${p.title}" />
        <textarea id="c-${p.id}">${p.content || ""}</textarea>

        <button onclick="MCN.savePost('${p.id}')">Save</button>
        <button onclick="MCN.deletePost('${p.id}')" class="danger">Delete</button>
      </div>
    `;

    if (box) box.innerHTML += html;
    if (dash) dash.innerHTML += `<div class="dashItem">${p.title}</div>`;
  });
}

async function savePost(id) {

  await updateDoc(doc(db, "posts", id), {
    title: el(`t-${id}`).value,
    content: el(`c-${id}`).value
  });

  console.log("✅ Post updated");
}

async function deletePost(id) {
  await deleteDoc(doc(db, "posts", id));
  console.log("🗑 Post deleted");
}

/* ================= SUPPORT CHAT ================= */

function initSupport() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, snap => {

    const users = [];

    snap.forEach(d => users.push(d.id));

    renderUsers(users);
    renderDashboard();
  });
}

function renderUsers(users) {

  const box = el("supportUsers");
  const dash = el("dashChats");

  if (box) box.innerHTML = "";
  if (dash) dash.innerHTML = "";

  users.forEach(u => {

    const html = `
      <div class="dashItem">
        👤 ${u}
        <button onclick="MCN.openChat('${u}')">Open</button>
      </div>
    `;

    if (box) box.innerHTML += html;
    if (dash) dash.innerHTML += `<div class="dashItem">${u}</div>`;
  });
}

function openChat(uid) {

  window.MCN_STATE.selectedUser = uid;

  const ref = collection(db, "supportChats", uid, "messages");

  onSnapshot(ref, snap => {

    const msgs = [];

    snap.forEach(d => msgs.push(d.data()));

    renderMessages(msgs, uid);
  });
}

function renderMessages(msgs, uid) {

  const box = el("supportMessages");

  if (box) box.innerHTML = "";

  msgs.forEach(m => {

    const div = document.createElement("div");
    div.className = "dashItem";
    div.innerHTML = `<b>${m.sender}</b><br>${m.text}`;
    box.appendChild(div);
  });

  // attach quick reply
  const input = el("supportReply");
  const btn = el("sendSupportReply");

  btn.onclick = async () => {

    if (!input.value) return;

    await addDoc(collection(db, "supportChats", uid, "messages"), {
      text: input.value,
      sender: "admin",
      createdAt: serverTimestamp()
    });

    input.value = "";
  };
}

/* ================= ADS (PRO MODE) ================= */

function initAds() {

  const ref = collection(db, "adRequests");

  onSnapshot(ref, snap => {

    const ads = [];

    snap.forEach(d => ads.push({ id: d.id, ...d.data() }));

    window.MCN_STATE.ads = ads;

    renderAds();
    renderDashboard();
  });
}

function renderAds() {

  const box = el("upgradeList");

  if (!box) return;

  box.innerHTML = "";

  window.MCN_STATE.ads.forEach(ad => {

    const html = `
      <div class="dashItem">
        <b>${ad.title || "Ad Request"}</b><br>
        Status: ${ad.status || "pending"}<br>

        <button onclick="MCN.approveAd('${ad.id}')">Approve</button>
        <button onclick="MCN.rejectAd('${ad.id}')">Reject</button>
      </div>
    `;

    box.innerHTML += html;
  });
}

async function approveAd(id) {

  await updateDoc(doc(db, "adRequests", id), {
    status: "approved"
  });

  console.log("✅ Ad approved");
}

async function rejectAd(id) {

  await updateDoc(doc(db, "adRequests", id), {
    status: "rejected"
  });

  console.log("❌ Ad rejected");
}

/* ================= DASHBOARD V2 ================= */

function renderDashboard() {

  const d1 = el("dashSystem");
  const d2 = el("dashPosts");
  const d3 = el("dashAdsPending");
  const d4 = el("dashChats");

  if (d1) d1.innerHTML = `
    <div class="dashItem">Posts: ${window.MCN_STATE.posts.length}</div>
    <div class="dashItem">Ads: ${window.MCN_STATE.ads.length}</div>
  `;

  if (d3) d3.innerHTML = window.MCN_STATE.ads
    .filter(a => a.status === "pending")
    .map(a => `<div class="dashItem">${a.title || "Ad"}</div>`)
    .join("");

}

/* ================= PUBLIC API ================= */

window.MCN = {
  savePost,
  deletePost,
  openChat,
  approveAd,
  rejectAd
};

/* ================= BOOT ================= */

export function startAdminEngine() {
  initPosts();
  initSupport();
  initAds();

  console.log("🚀 MCN PRO MODE ONLINE");
}