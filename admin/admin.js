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
   CONTROL ROOM LIVE SYSTEM
========================================= */

watchControls((data) => {

  log("📡 Control system updated");

  window.MCN_CONTROLS = data;

  window.featuredPostId = data.featuredPostId || null;
  window.sponsoredPostId = data.sponsoredPostId || null;
  window.adsEnabled = data.adsEnabled ?? true;
  window.discoverEnabled = data.discoverEnabled ?? true;
});

/* =========================================
   🔐 ADMIN AUTH (ANTI SPOOF CORE)
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
   AI WRITER
========================================= */

window.generateAI = () => {

  const topic = document.getElementById("aiTopic").value;

  document.getElementById("blogContent").value =
`AI article about ${topic}`;

  log("🤖 AI generated");
};

expose("generateAI", window.generateAI);

/* =========================================
   BLOG
========================================= */

window.createBlog = async () => {

  const title = document.getElementById("blogTitle").value;
  const content = document.getElementById("blogContent").value;
  const image = document.getElementById("blogImage").value;

  if (!title || !content) return alert("Missing fields");

  await addDoc(collection(db, "posts"), {
    title,
    content,
    image,
    createdAt: serverTimestamp()
  });

  log("✅ Blog created");
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

        <button class="small-btn"
          onclick="fillEdit('${p.id}','${encodeURIComponent(p.title)}','${encodeURIComponent(p.content)}')">
          Edit
        </button>

        <button class="small-btn"
          onclick="deletePost('${p.id}')">
          Delete
        </button>
      </div>
    `;
  });
}

expose("loadPosts", loadPosts);

/* =========================================
   SEARCH
========================================= */

window.searchPosts = () => {

  const q = document.getElementById("searchPosts").value.toLowerCase();

  renderPosts(allPosts.filter(p =>
    (p.title || "").toLowerCase().includes(q)
  ));
};

expose("searchPosts", window.searchPosts);

/* =========================================
   EDIT SYSTEM
========================================= */

window.fillEdit = (id, title, content) => {
  document.getElementById("editPostId").value = id;
  document.getElementById("editPostTitle").value = decodeURIComponent(title);
  document.getElementById("editPostContent").value = decodeURIComponent(content);
};

window.updatePost = async () => {

  const id = document.getElementById("editPostId").value;

  await updateDoc(doc(db, "posts", id), {
    title: document.getElementById("editPostTitle").value,
    content: document.getElementById("editPostContent").value
  });

  log("✅ Updated");
};

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
   CONTROL ROOM FUNCTIONS
========================================= */

window.setFeatured = async () => {

  const id = document.getElementById("featurePostId").value;

  await setControl("featuredPostId", id);

  log("⭐ Featured set");
};

window.setSponsored = async () => {

  const id = document.getElementById("sponsorPostId").value;
  const slot = document.getElementById("sponsorSlot").value;

  await setControl("sponsoredPostId", { id, slot });

  log("💰 Sponsored set");
};

window.toggleAds = async () => {

  const current = window.MCN_CONTROLS?.adsEnabled ?? true;

  await setControl("adsEnabled", !current);

  log("📢 Ads toggled");
};