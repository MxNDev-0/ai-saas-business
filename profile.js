import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= MONITOR LOG (NO CLEAR) ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  log("User logged in");

  loadUsername();
  loadFriendRequests();
  loadFriends();
  loadNotifications();
  monitorAdRequests();
  loadChat();
  startPriceMonitor();
});

/* ================= CHAT FIX (NO DUPLICATE) ================= */
window.sendChat = async () => {
  const input = document.getElementById("chatInput");
  if (!input.value.trim()) return;

  await addDoc(collection(db, "chats"), {
    text: input.value,
    uid: user.uid,
    username: user.email.split("@")[0],
    createdAt: serverTimestamp()
  });

  input.value = "";
};

function loadChat() {
  onSnapshot(collection(db, "chats"), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const m = change.doc.data();
        log(`💬 ${m.username}: ${m.text}`);
      }
    });
  });
}

/* ================= PRICE MONITOR (UP/DOWN) ================= */
let lastBTC = null;
let lastETH = null;

async function startPriceMonitor() {
  setInterval(async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
      const data = await res.json();

      const btc = data.bitcoin.usd;
      const eth = data.ethereum.usd;

      if (lastBTC !== null) {
        const arrow = btc > lastBTC ? "🔼" : "🔽";
        log(`BTC ${arrow} $${lastBTC} → $${btc}`);
      }

      if (lastETH !== null) {
        const arrow = eth > lastETH ? "🔼" : "🔽";
        log(`ETH ${arrow} $${lastETH} → $${eth}`);
      }

      lastBTC = btc;
      lastETH = eth;

    } catch {
      log("Price fetch failed");
    }
  }, 15000);
}

/* ================= REST (UNCHANGED CORE) ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  document.getElementById("usernameDisplay").innerText =
    snap.exists() ? snap.data().username : "Not set";
}

window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  if (!input.value) return;

  await setDoc(doc(db, "users", user.uid), { username: input.value }, { merge: true });
  log("Username updated");
};

window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  log("Password reset sent");
};

function loadNotifications() {
  onSnapshot(collection(db, "notifications", user.uid, "items"), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        log(change.doc.data().text);
      }
    });
  });
}

function monitorAdRequests() {
  onSnapshot(query(collection(db, "adRequests"), where("userId", "==", user.uid)), (snap) => {
    snap.forEach(d => {
      const ad = d.data();
      if (ad.status === "approved") log("Ad approved");
      if (ad.status === "rejected") log("Ad rejected");
    });
  });
}

function loadFriendRequests() {}
function loadFriends() {}