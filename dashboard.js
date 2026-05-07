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

    const userData = snap.data();

    console.log("Dashboard Loaded:", userData);

    loadNotifications();
    loadLivePrices();

  } catch (err) {

    console.error(err);
    alert("Dashboard failed to load");
  }
});

/* ================= LIVE PRICE SYSTEM ================= */
async function loadLivePrices() {

  const box = document.getElementById("priceBox");

  if (!box) return;

  try {

    const prices = [
      {
        name: "Bitcoin",
        symbol: "BTC",
        price: "$103,240"
      },
      {
        name: "Ethereum",
        symbol: "ETH",
        price: "$4,920"
      },
      {
        name: "Solana",
        symbol: "SOL",
        price: "$182"
      }
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
          <b>${p.name}</b>
          (${p.symbol})
          <br>
          <span style="color:#5bc0be;">
            ${p.price}
          </span>
        </div>
      `;
    });

  } catch (err) {

    console.error(err);

    box.innerHTML =
      "⚠️ Failed to load prices";
  }
}

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {

  const panel =
    document.getElementById("notifPanel");

  if (!panel) return;

  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  onSnapshot(q, (snap) => {

    panel.innerHTML = "";

    if (snap.empty) {

      panel.innerHTML = `
        <button>
          No notifications
        </button>
      `;

      return;
    }

    snap.forEach(d => {

      const n = d.data();

      panel.innerHTML += `
        <button>
          ${n.title || "Update"}
        </button>
      `;
    });

  }, (err) => {

    console.error(err);

    panel.innerHTML = `
      <button>
        Notification error
      </button>
    `;
  });
}

/* ================= TOGGLE NOTIFICATION ================= */
window.toggleNotif = function () {

  const panel =
    document.getElementById("notifPanel");

  panel.classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = async function () {

  try {

    await signOut(auth);

    window.location.href =
      "index.html";

  } catch (err) {

    console.error(err);

    alert("Logout failed");
  }
};

/* ================= ROUTING ================= */
window.goHome = function () {
  window.location.href = "dashboard.html";
};

window.goProfile = function () {
  window.location.href = "profile.html";
};

window.goMessages = function () {
  window.location.href = "messages.html";
};

window.goAdSpace = function () {
  window.location.href = "ads.html";
};

window.goBlog = function () {
  window.location.href = "blog/index.html";
};

window.goFaq = function () {
  window.location.href = "faq.html";
};

window.goAbout = function () {
  window.location.href = "about.html";
};

window.goContact = function () {
  window.location.href = "contact.html";
};

window.goDMCA = function () {
  window.location.href = "dmca.html";
};

window.goAdmin = async function () {

  if (!currentUser) return;

  try {

    const snap = await getDoc(
      doc(db, "users", currentUser.uid)
    );

    if (!snap.exists()) {
      alert("User not found");
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      alert("Admin only");
      return;
    }

    window.location.href = "admin.html";

  } catch (err) {

    console.error(err);

    alert("Admin check failed");
  }
};

/* ================= DONATE ================= */
window.donate = function () {

  alert(
    "Donation system coming soon 🚀"
  );
};