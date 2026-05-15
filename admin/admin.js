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
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL EXPOSE HELPER ================= */

const expose = (name, fn) => {
  window[name] = fn;
};

/* ================= LOG ================= */

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

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

  try {

    if (!user) {
      location.href = "./index.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      location.href = "./index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      location.href = "./dashboard.html";
      return;
    }

    log("✅ Admin online");

    loadPosts();
    loadAds();
    loadRejectedAds();

  } catch (err) {
    console.error(err);
    log("Auth failed", "error");
  }

});

/* ================= AI ================= */

const generateAI = () => {

  const topic = document.getElementById("aiTopic").value;

  document.getElementById("blogContent").value =
`AI article about ${topic}

MCN Engine generated article...`;

  log("AI article generated");
};

expose("generateAI", generateAI);

/* ================= BLOG ================= */

const createBlog = async () => {

  try {

    const title = document.getElementById("blogTitle").value;
    const content = document.getElementById("blogContent").value;
    const image = document.getElementById("blogImage").value;

    if (!title || !content) {
      alert("Missing fields");
      return;
    }

    await addDoc(collection(db, "posts"), {
      title,
      content,
      image,
      createdAt: serverTimestamp()
    });

    log("✅ Blog created");

  } catch (err) {
    console.error(err);
    log("Blog failed", "error");
  }
};

expose("createBlog", createBlog);

/* ================= POSTS ================= */

let allPosts = [];

function loadPosts() {

  const box = document.getElementById("postsList");

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {

    allPosts = [];
    box.innerHTML = "";

    snap.forEach(d => {
      allPosts.push({ id: d.id, ...d.data() });
    });

    renderPosts(allPosts);

  });
}

function renderPosts(posts) {

  const box = document.getElementById("postsList");
  box.innerHTML = "";

  if (posts.length === 0) {
    box.innerHTML = `<div class="item">No posts</div>`;
    return;
  }

  posts.forEach(p => {

    const safeTitle = encodeURIComponent(p.title || "");
    const safeContent = encodeURIComponent(p.content || "");

    box.innerHTML += `
      <div class="item">
        <b>${p.title || "Untitled"}</b><br>

        <button class="small-btn"
          onclick="fillEdit('${p.id}','${safeTitle}','${safeContent}')">
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

/* ================= SEARCH ================= */

const searchPosts = () => {

  const q = document.getElementById("searchPosts").value.toLowerCase();

  const filtered = allPosts.filter(p =>
    (p.title || "").toLowerCase().includes(q)
  );

  renderPosts(filtered);
};

expose("searchPosts", searchPosts);

/* ================= EDIT ================= */

const fillEdit = (id, title, content) => {

  document.getElementById("editPostId").value = id;
  document.getElementById("editPostTitle").value = decodeURIComponent(title);
  document.getElementById("editPostContent").value = decodeURIComponent(content);

};

expose("fillEdit", fillEdit);

const updatePost = async () => {

  try {

    const id = document.getElementById("editPostId").value;

    await updateDoc(doc(db, "posts", id), {
      title: document.getElementById("editPostTitle").value,
      content: document.getElementById("editPostContent").value
    });

    log("✅ Post updated");

  } catch (err) {
    console.error(err);
    log("Update failed", "error");
  }
};

expose("updatePost", updatePost);

const deletePost = async (id) => {

  await deleteDoc(doc(db, "posts", id));
  log("🗑 Post deleted", "warn");

};

expose("deletePost", deletePost);

/* ================= ADS ================= */

const loadAds = () => {

  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach(d => {

      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${ad.title}</b><br>

          <button class="small-btn"
            onclick="acceptAd('${d.id}')">
            Accept
          </button>

          <button class="small-btn"
            onclick="rejectAd('${d.id}')">
            Reject
          </button>
        </div>
      `;
    });

  });

};

expose("loadAds", loadAds);

const acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });
  log("✅ Ad accepted");
};

const rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
  log("❌ Ad rejected");
};

expose("acceptAd", acceptAd);
expose("rejectAd", rejectAd);

/* ================= REJECTED ADS ================= */

const loadRejectedAds = () => {

  const box = document.getElementById("rejectedList");

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach(d => {

      if (d.data().status === "rejected") {
        box.innerHTML += `
          <div class="item">❌ ${d.data().title}</div>
        `;
      }

    });

  });

};

expose("loadRejectedAds", loadRejectedAds);

const clearRejected = async () => {

  const snap = await getDocs(collection(db, "adRequests"));
  const batch = writeBatch(db);

  snap.forEach(d => {
    if (d.data().status === "rejected") {
      batch.delete(d.ref);
    }
  });

  await batch.commit();

  log("🧹 Rejected ads cleared");

};

expose("clearRejected", clearRejected);

/* ================= NEWS ================= */

const loadNews = async () => {

  const box = document.getElementById("newsList");
  const keyword = document.getElementById("newsKeyword").value || "technology";

  box.innerHTML = `<div class="item">Loading...</div>`;

  try {

    const res = await fetch(
      `https://gnews.io/api/v4/search?q=${keyword}&lang=en&max=5&apikey=YOUR_API_KEY`
    );

    const data = await res.json();

    box.innerHTML = "";

    if (!data.articles) {
      box.innerHTML = `<div class="item">No news found</div>`;
      return;
    }

    data.articles.forEach(a => {
      box.innerHTML += `
        <div class="item">
          <b>${a.title}</b><br><br>
          <a href="${a.url}" target="_blank" style="color:#5bc0be;">
            Read Article
          </a>
        </div>
      `;
    });

    log("📰 News loaded");

  } catch (err) {
    console.error(err);
    log("News failed", "error");
  }

};

expose("loadNews", loadNews);