/* =========================================
   🧠 MCN ADMIN STATE ENGINE v1
   Posts + Support + Controls + Diagnostics
   SINGLE SOURCE OF TRUTH LAYER
========================================= */

import { db } from "../firebase.js";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL STATE ================= */

window.MCN_STATE = {
  posts: [],
  users: [],
  chats: {},
  selectedPost: null,
  selectedUser: null,
  systemHealth: 100
};

/* ================= DOM REFERENCES ================= */

const postsList = () => document.getElementById("postsList");
const supportUsers = () => document.getElementById("supportUsers");
const supportMessages = () => document.getElementById("supportMessages");

const editId = () => document.getElementById("editPostId");
const editTitle = () => document.getElementById("editPostTitle");
const editContent = () => document.getElementById("editPostContent");

/* =========================================
   🧠 POSTS ENGINE (REALTIME)
========================================= */

function initPosts() {

  const ref = collection(db, "posts");

  onSnapshot(ref, (snap) => {

    const list = [];

    snap.forEach(d => {
      list.push({ id: d.id, ...d.data() });
    });

    window.MCN_STATE.posts = list;

    renderPosts();

    window.MCN_SYSTEM.stats.posts = list.length;
    window.MCN_SYSTEM.stats.lastEvent = "posts:sync";

  });
}

/* ================= RENDER POSTS ================= */

function renderPosts() {

  const box = postsList();
  if (!box) return;

  box.innerHTML = "";

  window.MCN_STATE.posts.forEach(post => {

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${post.title}</b>
      <br>
      <small>${(post.content || "").slice(0, 60)}...</small>
      <br>
      <button class="small-btn" onclick="MCN.selectPost('${post.id}')">Edit</button>
      <button class="small-btn danger" onclick="MCN.deletePost('${post.id}')">Delete</button>
    `;

    box.appendChild(div);
  });
}

/* ================= SELECT POST ================= */

function selectPost(id) {

  const post = window.MCN_STATE.posts.find(p => p.id === id);
  if (!post) return;

  window.MCN_STATE.selectedPost = post;

  if (editId()) editId().value = post.id;
  if (editTitle()) editTitle().value = post.title;
  if (editContent()) editContent().value = post.content;

}

/* ================= UPDATE POST ================= */

async function updatePost() {

  const id = editId()?.value;
  if (!id) return alert("No post selected");

  await updateDoc(doc(db, "posts", id), {
    title: editTitle().value,
    content: editContent().value
  });

  alert("Post updated");
}

/* ================= DELETE POST ================= */

async function deletePost(id) {

  if (!confirm("Delete this post?")) return;

  await deleteDoc(doc(db, "posts", id));

  alert("Post deleted");
}

/* =========================================
   💬 SUPPORT ENGINE (REALTIME)
========================================= */

function initSupport() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, (snap) => {

    const users = [];

    snap.forEach(d => {
      users.push(d.id);
    });

    window.MCN_STATE.users = users;

    renderUsers();

    window.MCN_SYSTEM.stats.supportChats = users.length;
    window.MCN_SYSTEM.stats.lastEvent = "support:sync";

  });

}

/* ================= SUPPORT USERS ================= */

function renderUsers() {

  const box = supportUsers();
  if (!box) return;

  box.innerHTML = "";

  window.MCN_STATE.users.forEach(uid => {

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      👤 ${uid}
      <button class="small-btn" onclick="MCN.openChat('${uid}')">Open</button>
    `;

    box.appendChild(div);
  });
}

/* ================= OPEN CHAT ================= */

function openChat(uid) {

  window.MCN_STATE.selectedUser = uid;

  const ref = collection(db, "supportChats", uid, "messages");

  onSnapshot(ref, (snap) => {

    const messages = [];

    snap.forEach(d => messages.push(d.data()));

    window.MCN_STATE.chats[uid] = messages;

    renderMessages(uid);

  });
}

/* ================= RENDER MESSAGES ================= */

function renderMessages(uid) {

  const box = supportMessages();
  if (!box) return;

  const msgs = window.MCN_STATE.chats[uid] || [];

  box.innerHTML = "";

  msgs.forEach(m => {

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${m.sender}</b><br>
      ${m.text}
    `;

    box.appendChild(div);
  });

}

/* =========================================
   🧠 GLOBAL API (EXPOSE TO BOOT)
========================================= */

window.MCN = {
  selectPost,
  updatePost,
  deletePost,
  openChat
};

/* =========================================
   🚀 INIT ENGINE
========================================= */

export function startAdminEngine() {
  initPosts();
  initSupport();

  console.log("🧠 MCN STATE ENGINE ONLINE");
}