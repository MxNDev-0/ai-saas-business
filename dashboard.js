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
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  setupPresence(); // 🔥 NEW
  loadFeed();
  loadWallet();
  loadCryptoPrices();
  loadOnlineUsers(); // 🔥 NEW
});

/* ================= PRESENCE SYSTEM (FIXED) ================= */
async function setupPresence() {
  if (!user) return;

  const ref = doc(db, "onlineUsers", user.uid);

  // mark online
  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    online: true,
    lastSeen: Date.now()
  });

  // mark offline on disconnect / close
  window.addEventListener("beforeunload", async () => {
    try {
      await updateDoc(ref, {
        online: false,
        lastSeen: Date.now()
      });
    } catch (e) {}
  });
}

/* ================= ONLINE USERS (REAL TIME FIX) ================= */
function loadOnlineUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  const q = query(collection(db, "onlineUsers"), orderBy("lastSeen", "desc"));

  onSnapshot(q, (snap) => {
    let count = 0;
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const u = docSnap.data();

      // only show active users (last 60 seconds)
      const isOnline = Date.now() - u.lastSeen < 60000;

      if (isOnline) count++;

      box.innerHTML += `
        <div style="padding:6px;margin:5px 0;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <span style="float:right;color:${isOnline ? "lime" : "gray"};">
            ${isOnline ? "Online 🟢" : "Offline ⚪"}
          </span>
        </div>
      `;
    });

    // show count on top
    box.innerHTML =
      `<p><b>Online Users: ${count}</b></p>` + box.innerHTML;
  });
}

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

/* ================= CHAT ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  if (!input || !user) return;

  const text = input.value.trim();
  if (!text) return;

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

/* ================= CRYPTO PRICES (FIXED) ================= */
async function loadCryptoPrices() {
  const el = document.getElementById("btcPrice");
  if (!el) return;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether&vs_currencies=usd"
    );

    const data = await res.json();

    el.innerText =
      "BTC: $" + (data.bitcoin?.usd ?? 0) +
      " | ETH: $" + (data.ethereum?.usd ?? 0) +
      " | BNB: $" + (data.binancecoin?.usd ?? 0) +
      " | USDT: $" + (data.tether?.usd ?? 0);

  } catch (err) {
    el.innerText = "Crypto prices unavailable";
  }
}

setInterval(loadCryptoPrices, 30000);

/* ================= UPGRADE ================= */
const UPGRADE_LINK = "https://nowpayments.io/payment/?iid=5153003613";

function handleUpgrade() {
  if (!user) return alert("Login required");

  window.open(UPGRADE_LINK, "_blank");

  setDoc(doc(db, "upgradeRequests", user.uid), {
    uid: user.uid,
    email: user.email,
    status: "pending",
    createdAt: Date.now()
  });
}

window.goPremium = handleUpgrade;
window.upgrade = handleUpgrade;

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
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};