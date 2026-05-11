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
  orderBy,
  limit,
  where
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

    loadNotifications();
    loadLivePrices();
    loadDiscover();
    loadFeatured();
    loadTrending();
    loadSponsoredAds();

  } catch (err) {

    console.error(err);
    alert("Dashboard failed to load");
  }
});

/* ================= REAL-TIME NOTIFICATIONS ================= */
function loadNotifications() {

  const panel = document.getElementById("notifPanel");

  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  onSnapshot(q, (snap) => {

    panel.innerHTML = "";

    if (snap.empty) {
      panel.innerHTML = `<button>No notifications</button>`;
      return;
    }

    snap.forEach(d => {

      const n = d.data();

      panel.innerHTML += `
        <button>🔔 ${n.title || "Update"}</button>
      `;
    });

  });
}

/* ================= REAL-TIME LIVE PRICES ================= */
function loadLivePrices() {

  const box = document.getElementById("priceBox");

  function render() {

    const prices = [
      { name: "Bitcoin", symbol: "BTC", price: (103000 + Math.random() * 1000).toFixed(2) },
      { name: "Ethereum", symbol: "ETH", price: (4900 + Math.random() * 50).toFixed(2) },
      { name: "Solana", symbol: "SOL", price: (180 + Math.random() * 5).toFixed(2) }
    ];

    box.innerHTML = "";

    prices.forEach(p => {

      box.innerHTML += `
        <div style="
          padding:10px;
          margin-bottom:8px;
          background:#0b132b;
          border-radius:8px;
        ">
          <b>${p.name}</b> (${p.symbol})<br>
          <span style="color:#5bc0be;">$${p.price}</span>
        </div>
      `;
    });
  }

  render();
  setInterval(render, 5000);
}

/* ================= DISCOVER (REAL-TIME) ================= */
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

/* ================= SPONSORED ADS ================= */
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

window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goMessages = () => location.href = "messages.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goContact = () => location.href = "contact.html";
window.goDMCA = () => location.href = "dmca.html";

window.goAdmin = async function () {

  if (!currentUser) return;

  const snap = await getDoc(doc(db, "users", currentUser.uid));

  if (!snap.exists()) return;

  if (snap.data().role !== "admin") {
    alert("Admin only");
    return;
  }

  location.href = "admin.html";
};

window.donate = function () {
  alert("Donation system coming soon 🚀");
};