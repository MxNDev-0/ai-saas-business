import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  loadFeed();
  loadWallet();
  loadBTCPrice();
});

/* ================= FEED ================= */
function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(docSnap => {
      const m = docSnap.data();

      box.innerHTML += `
        <div style="margin:6px 0;">
          <b style="color:#5bc0be;">${m.user}</b>
          <div style="color:#fff;">${m.text}</div>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text || !user) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  input.value = "";
};

/* ================= WALLET ================= */
function loadWallet() {
  const walletRef = doc(db, "wallet", "main");

  onSnapshot(walletRef, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    const balanceEl = document.getElementById("walletBalance");
    const updatedEl = document.getElementById("walletUpdated");

    if (balanceEl) balanceEl.innerText = data.balance ?? 0;

    if (updatedEl) {
      updatedEl.innerText = data.lastUpdated
        ? new Date(data.lastUpdated).toLocaleString()
        : "-";
    }
  });
}

/* ================= BTC PRICE ================= */
async function loadBTCPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );

    const data = await res.json();

    const btcEl = document.getElementById("btcPrice");
    if (btcEl) btcEl.innerText = data.bitcoin.usd;

  } catch (e) {
    const btcEl = document.getElementById("btcPrice");
    if (btcEl) btcEl.innerText = "Error";
  }
}

setInterval(loadBTCPrice, 30000);

/* ================= 🔥 UPGRADE FIX (100% WORKING) ================= */

const UPGRADE_LINK = "https://nowpayments.io/payment/?iid=5153003613";

/* IMPORTANT: FORCE GLOBAL SCOPE */
window.goPremium = function () {
  alert("Upgrade clicked ✅");

  if (!user) {
    alert("Not logged in");
    return;
  }

  // open payment
  window.open(UPGRADE_LINK, "_blank");

  // save request
  setDoc(doc(db, "upgradeRequests", user.uid), {
    uid: user.uid,
    email: user.email,
    status: "pending",
    source: "NOWPayments",
    createdAt: Date.now()
  });
};

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  if (m) m.style.display = m.style.display === "block" ? "none" : "block";
};

function closeMenu() {
  const m = document.getElementById("menu");
  if (m) m.style.display = "none";
}

window.goProfile = () => {
  closeMenu();
  location.href = "profile.html";
};

window.goHome = () => {
  closeMenu();
  location.reload();
};

window.goAdmin = () => {
  closeMenu();

  if (!user) return;

  if (user.email !== "nc.maxiboro@gmail.com") {
    alert("❌ Admin locked");
  } else {
    location.href = "admin.html";
  }
};

/* ================= LOGOUT ================= */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};