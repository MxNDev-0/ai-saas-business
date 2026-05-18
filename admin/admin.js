/* =========================================
   🧠 MCN ADMIN STATE ENGINE v2 (FIXED)
   LIVE POSTS + INLINE EDIT + SUPPORT FIX
========================================= */

import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL STATE ================= */

window.MCN_STATE = {
  posts: [],
  chats: {},
  selectedUser: null
};

/* ================= SAFE HELPERS ================= */

function el(id) {
  return document.getElementById(id);
}

/* ================= POSTS LIVE ENGINE ================= */

function initPosts() {

  const qRef = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(qRef, (snap) => {

    const posts = [];

    snap.forEach(d => {
      posts.push({ id: d.id, ...d.data() });
    });

    window.MCN_STATE.posts = posts;

    renderPosts();

    if (window.MCN_SYSTEM) {
      window.MCN_SYSTEM.stats.posts = posts.length;
      window.MCN_SYSTEM.stats.lastEvent = "posts:live";
    }
  });
}

/* ================= RENDER POSTS (LIVE + INLINE EDIT) ================= */

function renderPosts() {

  const box = el("postsList");
  const dash = el("dashPosts");

  if (box) box.innerHTML = "";
  if (dash) dash.innerHTML = "";

  window.MCN_STATE.posts.forEach(post => {

    const html = `
      <div class="item">
        <input id="t-${post.id}" value="${post.title}" style="width:100%;margin-bottom:5px;">
        <textarea id="c-${post.id}" style="width:100%;height:80px;">${post.content || ""}</textarea>

        <button onclick="MCN.savePost('${post.id}')">Save</button>
        <button onclick="MCN.deletePost('${post.id}')" class="danger">Delete</button>
      </div>
    `;

    if (box) box.innerHTML += html;
    if (dash) dash.innerHTML += `<div class="dashItem">${post.title}</div>`;
  });
}

/* ================= SAVE INLINE EDIT ================= */

async function savePost(id) {

  const title = el(`t-${id}`)?.value;
  const content = el(`c-${id}`)?.value;

  if (!title) return alert("Missing title");

  await updateDoc(doc(db, "posts", id), {
    title,
    content
  });

  console.log("✅ Post updated:", id);
}

/* ================= DELETE ================= */

async function deletePost(id) {

  if (!confirm("Delete post?")) return;

  await deleteDoc(doc(db, "posts", id));

  console.log("🗑 Deleted:", id);
}

/* ================= SUPPORT ENGINE FIX ================= */

function initSupport() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, (snap) => {

    const users = [];

    snap.forEach(d => users.push(d.id));

    renderUsers(users);

    if (window.MCN_SYSTEM) {
      window.MCN_SYSTEM.stats.supportChats = users.length;
      window.MCN_SYSTEM.stats.lastEvent = "support:live";
    }
  });
}

/* ================= USERS ================= */

function renderUsers(users) {

  const box = el("supportUsers");
  const dash = el("dashChats");

  if (box) box.innerHTML = "";
  if (dash) dash.innerHTML = "";

  users.forEach(uid => {

    const html = `
      <div class="item">
        👤 ${uid}
        <button onclick="MCN.openChat('${uid}')">Open</button>
      </div>
    `;

    if (box) box.innerHTML += html;
    if (dash) dash.innerHTML += `<div class="dashItem">${uid}</div>`;
  });
}

/* ================= CHAT OPEN ================= */

function openChat(uid) {

  window.MCN_STATE.selectedUser = uid;

  const ref = collection(db, "supportChats", uid, "messages");

  onSnapshot(ref, (snap) => {

    const msgs = [];

    snap.forEach(d => msgs.push(d.data()));

    renderMessages(msgs);
  });
}

/* ================= RENDER MESSAGES ================= */

function renderMessages(msgs) {

  const box = el("supportMessages");
  const dash = el("dashSystem");

  if (box) box.innerHTML = "";

  msgs.forEach(m => {

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${m.sender}</b><br>
      ${m.text}
    `;

    if (box) box.appendChild(div);
  });

  if (dash) {
    dash.innerHTML = `<div class="dashItem">Live chats active: ${msgs.length}</div>`;
  }
}

/* ================= PUBLIC API ================= */

window.MCN = {
  savePost,
  deletePost,
  openChat
};

/* ================= BOOT ================= */

export function startAdminEngine() {
  initPosts();
  initSupport();

  console.log("🧠 MCN STATE ENGINE v2 ONLINE");
}