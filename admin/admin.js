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
   AI ENGINE IMPORT (LEVEL 2)
========================================= */
import {
  autoGenerateBlog,
  generateAIArticle
} from "./admin/ai-engine.js";

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
   BLOG CREATE / UPDATE (AI POWERED)
========================================= */

window.createBlog = async function () {

  const id = document.getElementById("editPostId")?.value;
  const title = document.getElementById("blogTitle")?.value;
  let content = document.getElementById("blogContent")?.value;
  const image = document.getElementById("blogImage")?.value;

  if (!title) return log("Missing title", "warn");

  if (!content) {
    content = await generateAIArticle(title);
  }

  try {

    if (id) {

      await updateDoc(doc(db, "posts", id), {
        title,
        content,
        image,
        updatedAt: serverTimestamp()
      });

      log("✏ Post updated");

    } else {

      await addDoc(collection(db, "posts"), {
        title,
        content,
        image,
        createdAt: serverTimestamp(),
        author: window.MCN_ADMIN?.uid || "admin",
        aiGenerated: !document.getElementById("blogContent")?.value
      });

      log("📝 Post created");
    }

  } catch (err) {
    console.error(err);
    log("Blog save failed", "error");
  }

  clearEditor();
};

/* =========================================
   LOAD POSTS
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

/* =========================================
   RENDER POSTS
========================================= */

function renderPosts(posts) {

  const box = document.getElementById("postsList");
  box.innerHTML = "";

  posts.forEach(p => {

    box.innerHTML += `
      <div class="item">

        <b>${p.title}</b><br>

        <small>🆔 ${p.id}</small><br>
        <small>${p.aiGenerated ? "🤖 AI POST" : "✍ Manual"}</small><br>

        <button onclick='loadIntoEditor(${JSON.stringify(p)})'>
          Edit
        </button>

        <button onclick="deletePost('${p.id}')">
          Delete
        </button>

        <button onclick="copyPostId('${p.id}')">
          Copy ID
        </button>

      </div>
    `;
  });
}

expose("loadPosts", loadPosts);

/* =========================================
   EDITOR
========================================= */

window.loadIntoEditor = function (post) {

  document.getElementById("editPostId").value = post.id || "";
  document.getElementById("blogTitle").value = post.title || "";
  document.getElementById("blogContent").value = post.content || "";
  document.getElementById("blogImage").value = post.image || "";

  log("✏ Loaded into editor");
};

/* =========================================
   CLEAR EDITOR
========================================= */

function clearEditor() {

  document.getElementById("editPostId").value = "";
  document.getElementById("blogTitle").value = "";
  document.getElementById("blogContent").value = "";
  document.getElementById("blogImage").value = "";
}

/* =========================================
   DELETE + COPY
========================================= */

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Deleted post");
};

window.copyPostId = function (id) {
  navigator.clipboard.writeText(id);
  log("🆔 Post ID copied");
};

/* =========================================
   AI UI FUNCTIONS (INTEGRATED)
========================================= */

window.generateAndPreview = async function () {

  const topic = document.getElementById("aiTopic")?.value;

  if (!topic) return log("Enter topic", "warn");

  log("🤖 Generating preview...");

  const content = await generateAIArticle(topic);

  alert(content);

  log("✅ Preview ready");
};

window.autoPublishBlog = async function () {

  const topic = document.getElementById("aiTopic")?.value;

  if (!topic) return log("Missing topic", "warn");

  log("🚀 Auto publishing blog...");

  const post = await autoGenerateBlog(topic);

  log("📝 Published: " + post.title);
};

/* =========================================
   TRENDING TOPICS
========================================= */

window.loadTrending = function () {

  const box = document.getElementById("trendingBox");
  if (!box) return;

  const trends = [
    "AI job boom in Africa",
    "Bitcoin surge 2026",
    "Remote work explosion",
    "Nigeria tech startups",
    "Content creator monetization"
  ];

  box.innerHTML = "";

  trends.forEach(t => {
    box.innerHTML += `
      <div class="item" onclick="selectTrend('${t}')">
        🔥 ${t}
      </div>
    `;
  });
};

window.selectTrend = function (topic) {
  document.getElementById("aiTopic").value = topic;
  log("🔥 Selected trend: " + topic);
};

/* =========================================
   AI SETTINGS
========================================= */

window.applyAISettings = function () {

  const provider = document.getElementById("aiProvider")?.value;

  if (window.AI_CONFIG) {
    window.AI_CONFIG.provider = provider;
  }

  log("⚙ AI provider set to: " + provider);
};