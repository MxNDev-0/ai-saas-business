import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  query,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html?login=required";
    return;
  }

  currentUser = user;

  loadNews();
  loadFeatured();
  loadTrending();
  loadDiscover();
});

/* ================= 📰 GOOGLE NEWS RSS ================= */
async function loadNews() {

  const box = document.getElementById("newsBox");

  try {
    // US Google News RSS (Business + Tech blend)
    const rssUrl =
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl)
    );

    const data = await res.json();

    box.innerHTML = "";

    data.items.slice(0, 6).forEach(item => {

      box.innerHTML += `
        <div class="news-item" onclick="window.open('${item.link}','_blank')">

          <div class="news-title">${item.title}</div>

          <div class="news-date">
            ${new Date(item.pubDate).toLocaleString()}
          </div>

        </div>
      `;
    });

  } catch (e) {
    box.innerHTML = "Failed to load news feed";
  }
}

/* ================= FEATURED ================= */
function loadFeatured() {

  const box = document.getElementById("featuredBox");

  const q = query(collection(db, "posts"), limit(3));

  onSnapshot(q, snap => {
    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="card">
          ⭐ ${p.title}
        </div>
      `;
    });
  });
}

/* ================= TRENDING ================= */
function loadTrending() {

  const box = document.getElementById("trendingBox");

  const q = query(collection(db, "posts"), limit(5));

  onSnapshot(q, snap => {
    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="card">
          🔥 ${p.title}
        </div>
      `;
    });
  });
}

/* ================= DISCOVER ================= */
function loadDiscover() {

  const box = document.getElementById("discoverBox");

  const q = query(collection(db, "posts"), limit(5));

  onSnapshot(q, snap => {
    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="card">
          ${p.title}
        </div>
      `;
    });
  });
}

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};