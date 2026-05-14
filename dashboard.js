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

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html?login=required";
    return;
  }

  currentUser = user;

  try {
    loadNews();
    loadFeatured();
    loadTrending();
    loadDiscover();
  } catch (e) {
    console.error("Dashboard load error:", e);
  }
});

/* ================= NEWS ================= */
async function loadNews() {

  const box = document.getElementById("newsBox");

  try {
    const rssUrl =
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(rssUrl)
    );

    const data = await res.json();

    box.innerHTML = "";

    data.items.slice(0, 6).forEach(item => {

      box.innerHTML += `
        <div class="news-item"
          onclick="window.open('${item.link}','_blank')">

          <div class="news-title">${item.title}</div>

        </div>
      `;
    });

  } catch (e) {
    box.innerHTML = "Failed to load news feed";
  }
}

/* ================= POSTS ================= */
function loadFeatured() {

  const box = document.getElementById("featuredBox");

  const q = query(collection(db, "posts"), limit(3));

  onSnapshot(q, snap => {

    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="card">⭐ ${p.title}</div>
      `;
    });
  });
}

function loadTrending() {

  const box = document.getElementById("trendingBox");

  const q = query(collection(db, "posts"), limit(5));

  onSnapshot(q, snap => {

    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="card">🔥 ${p.title}</div>
      `;
    });
  });
}

function loadDiscover() {

  const box = document.getElementById("discoverBox");

  const q = query(collection(db, "posts"), limit(5));

  onSnapshot(q, snap => {

    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      box.innerHTML += `
        <div class="card">${p.title}</div>
      `;
    });
  });
}

/* ================= LOGOUT FIX ================= */
window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};

/* ================= NAV FIX (SAFE) ================= */
window.goHome = () => location.href = "dashboard.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goContact = () => location.href = "contact.html";