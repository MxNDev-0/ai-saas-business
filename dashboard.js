import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= AUTH ================= */
let currentUser = null;

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "index.html?login=required";
    return;
  }

  currentUser = user;

  console.log("Dashboard loaded (clean mode)");

  loadLivePrices();
  loadDiscover();
  loadFeatured();
  loadTrending();
  loadSponsoredAds();
});

/* ================= LIVE PRICES ================= */
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
        <div style="padding:10px;margin-bottom:8px;background:#0b132b;border-radius:8px;">
          <b>${p.name}</b> (${p.symbol})<br>
          <span style="color:#5bc0be;">$${p.price}</span>
        </div>
      `;
    });
  }

  render();
  setInterval(render, 5000);
}

/* ================= DISCOVER (CLEAN RSS/API FEED) ================= */
function loadDiscover() {

  const box = document.getElementById("discoverBox");

  box.innerHTML = "Loading feed...";

  fetch("https://mxm-backend.onrender.com/blog/latest?limit=5")
    .then(res => res.json())
    .then(posts => {

      box.innerHTML = "";

      if (!posts || posts.length === 0) {
        box.innerHTML = "No content available";
        return;
      }

      posts.forEach(p => {

        box.innerHTML += `
          <div class="card" onclick="openPost('${p.id}')">
            <b>${p.title}</b>
            <div style="font-size:12px;opacity:0.7;">
              ${(p.content || "").substring(0,120)}...
            </div>
          </div>
        `;
      });

    })
    .catch(() => {
      box.innerHTML = "Failed to load feed";
    });
}

/* ================= FEATURED ================= */
function loadFeatured() {

  const box = document.getElementById("featuredBox");

  fetch("https://mxm-backend.onrender.com/blog/latest?limit=3")
    .then(res => res.json())
    .then(posts => {

      if (!posts || !posts.length) {
        box.innerHTML = "No featured content";
        return;
      }

      const featured = posts[0];

      box.innerHTML = `
        <div class="card">
          ⭐ ${featured.title}
        </div>
      `;
    });
}

/* ================= TRENDING ================= */
function loadTrending() {

  const box = document.getElementById("trendingBox");

  fetch("https://mxm-backend.onrender.com/blog/latest?limit=5")
    .then(res => res.json())
    .then(posts => {

      box.innerHTML = "";

      posts.forEach(p => {
        box.innerHTML += `
          <div class="card">
            🔥 ${p.title}
          </div>
        `;
      });
    });
}

/* ================= ADS ================= */
function loadSponsoredAds() {

  const slider = document.getElementById("adsSlider");

  slider.innerHTML = `
    <div class="ad">
      <div class="ad-box">🚀 Ads loading...</div>
    </div>
  `;
}

/* ================= ADS SLIDER ================= */
let index = 0;

setInterval(() => {

  const slider = document.getElementById("adsSlider");

  if (!slider || !slider.children.length) return;

  index = (index + 1) % slider.children.length;

  slider.style.transform = `translateX(-${index * 100}%)`;

}, 3500);

/* ================= ROUTING (CLEAN ONLY) ================= */
window.openPost = function (id) {
  window.location.href = "post.html?id=" + encodeURIComponent(id);
};

window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};

/* ONLY KEEP NAVIGATION YOU NEED */
window.goHome = () => location.href = "dashboard.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goContact = () => location.href = "contact.html";
window.goDMCA = () => location.href = "dmca.html";