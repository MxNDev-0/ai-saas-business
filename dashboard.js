import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= USER STATE ================= */
let currentUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {

    if (!sessionStorage.getItem("redirectAfterLogin")) {
      sessionStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );
    }

    window.location.href = "index.html?login=required";
    return;
  }

  currentUser = user;

  try {

    const snap = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!snap.exists()) {
      alert("User profile not found");
      window.location.href = "index.html";
      return;
    }

    console.log("Dashboard Loaded");

    loadLiveNews();
    loadDiscover();
    loadFeatured();
    loadTrending();
    loadSponsoredAds();

  } catch (err) {

    console.error(err);
    alert("Dashboard failed to load");
  }
});

/* ================= USA NEWS ENGINE (REPLACES CRYPTO PRICES) ================= */
function loadLiveNews() {

  const box = document.getElementById("priceBox");

  async function render() {

    try {

      const res = await fetch(
        "https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/news/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en"
      );

      const data = await res.json();

      box.innerHTML = "";

      data.items.slice(0, 5).forEach(item => {

        box.innerHTML += `
          <div style="
            padding:10px;
            margin-bottom:8px;
            background:#0b132b;
            border-radius:8px;
          ">
            <b>${item.title}</b><br>
            <a href="${item.link}" target="_blank"
              style="color:#5bc0be;font-size:12px;">
              Read more →
            </a>
          </div>
        `;
      });

    } catch (e) {
      box.innerHTML = "News loading failed";
    }
  }

  render();
  setInterval(render, 60000);
}

/* ================= DISCOVER ================= */
function loadDiscover() {

  const box = document.getElementById("discoverBox");

  const q = query(
    collection(db, "posts"),
    where("visibility.dashboard", "==", true),
    limit(5)
  );

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = "No posts available";
      return;
    }

    snap.forEach(docSnap => {

      const post = docSnap.data();

      box.innerHTML += `
        <div class="card" onclick="openPost('${docSnap.id}')">
          <b>${post.title}</b>
          <div style="font-size:12px;opacity:0.7;">
            ${(post.content || "").substring(0,120)}...
          </div>
        </div>
      `;
    });

  });
}

/* ================= FEATURED ================= */
function loadFeatured() {

  const box = document.getElementById("featuredBox");

  const q = query(
    collection(db, "posts"),
    where("visibility.featured", "==", true),
    limit(3)
  );

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = "No featured posts";
      return;
    }

    snap.forEach(docSnap => {

      const p = docSnap.data();

      box.innerHTML += `
        <div class="card" onclick="openPost('${docSnap.id}')">
          ⭐ ${p.title}
        </div>
      `;
    });

  });
}

/* ================= TRENDING ================= */
function loadTrending() {

  const box = document.getElementById("trendingBox");

  const q = query(
    collection(db, "posts"),
    where("visibility.trending", "==", true),
    limit(5)
  );

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = "No trending posts";
      return;
    }

    snap.forEach(docSnap => {

      const p = docSnap.data();

      box.innerHTML += `
        <div class="card" onclick="openPost('${docSnap.id}')">
          🔥 ${p.title}
        </div>
      `;
    });

  });
}

/* ================= ADS ================= */
function loadSponsoredAds() {

  const slider = document.getElementById("adsSlider");

  const q = query(
    collection(db, "posts"),
    where("sponsored.isSponsored", "==", true),
    limit(10)
  );

  onSnapshot(q, (snap) => {

    slider.innerHTML = "";

    if (snap.empty) {
      slider.innerHTML = `
        <div class="ad">
          <div class="ad-box">🚀 No sponsored ads yet</div>
        </div>
      `;
      return;
    }

    snap.forEach(docSnap => {

      const post = docSnap.data();

      slider.innerHTML += `
        <div class="ad">
          <div class="ad-box" onclick="openPost('${docSnap.id}')">
            💰 ${post.title}
          </div>
        </div>
      `;
    });

  });
}

/* ================= ADS SLIDER ================= */
let index = 0;

setInterval(() => {

  const slider = document.getElementById("adsSlider");

  if (!slider || !slider.children.length) return;

  index = (index + 1) % slider.children.length;

  slider.style.transform =
    `translateX(-${index * 100}%)`;

}, 3500);

/* ================= ROUTING ================= */
window.openPost = function (id) {
  window.location.href = "post.html?id=" + encodeURIComponent(id);
};

window.toggleNotif = function () {
  document.getElementById("notifPanel").classList.toggle("active");
};

window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};