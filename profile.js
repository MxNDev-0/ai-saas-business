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
  updateDoc,
  doc,
  getDoc,
  setDoc,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= SAFE LOG ================= */
function log(msg, color = "#fff") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const line = document.createElement("div");
  line.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
  line.style.color = color;
  line.style.fontSize = "13px";

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  log("System booting...");
  log("User authenticated");

  try {
    await loadUsername();
    loadFriendRequests();
    loadFriends();
    loadNotifications();
    monitorAdRequests();

    // FORCE START
    loadChat();
    startCryptoMonitor();

    log("All systems running", "#00ff88");

  } catch (err) {
    console.error(err);
    log("ERROR: " + err.message, "#ff4d4d");
  }
});

/* ================= CHAT ================= */
function loadChat() {
  try {
    onSnapshot(collection(db, "chats"),
      (snap) => {
        log("Chat listener active", "#ccc");

        snap.docChanges().forEach(change => {
          if (change.type === "added") {
            const m = change.doc.data();
            log(`💬 <b>${m.username}</b>: ${m.text}`, "#5bc0be");
          }
        });
      },
      (error) => {
        console.error(error);
        log("Chat error: " + error.message, "#ff4d4d");
      }
    );
  } catch (err) {
    log("Chat crash", "#ff4d4d");
  }
}

window.sendChat = async function () {
  const input = document.getElementById("chatInput");
  if (!input || !input.value.trim()) return;

  try {
    await addDoc(collection(db, "chats"), {
      text: input.value,
      uid: user.uid,
      username: user.email.split("@")[0],
      createdAt: serverTimestamp()
    });

    log("Message sent", "#00ff88");

    input.value = "";
  } catch (err) {
    console.error(err);
    log("Send failed: " + err.message, "#ff4d4d");
  }
};

/* ================= CRYPTO ================= */
let lastBTC = null;
let lastETH = null;

async function fetchCrypto() {
  try {
    log("Fetching crypto...", "#ccc");

    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,ngn");
    const data = await res.json();

    const btc = data.bitcoin.usd;
    const eth = data.ethereum.usd;

    if (lastBTC !== null) {
      const arrow = btc > lastBTC ? "🔺" : btc < lastBTC ? "🔻" : "⏺";
      const color = btc > lastBTC ? "#00ff88" : "#ff4d4d";

      log(`BTC ${arrow} $${btc.toLocaleString()} (from $${lastBTC.toLocaleString()})`, color);
    } else {
      log(`BTC → $${btc.toLocaleString()} | ₦${data.bitcoin.ngn.toLocaleString()}`, "#ccc");
    }

    if (lastETH !== null) {
      const arrow = eth > lastETH ? "🔺" : eth < lastETH ? "🔻" : "⏺";
      const color = eth > lastETH ? "#00ff88" : "#ff4d4d";

      log(`ETH ${arrow} $${eth.toLocaleString()} (from $${lastETH.toLocaleString()})`, color);
    } else {
      log(`ETH → $${eth.toLocaleString()} | ₦${data.ethereum.ngn.toLocaleString()}`, "#ccc");
    }

    lastBTC = btc;
    lastETH = eth;

  } catch (err) {
    console.error(err);
    log("Crypto error: " + err.message, "#ff4d4d");
  }
}

function startCryptoMonitor() {
  log("Crypto monitor started", "#ccc");
  fetchCrypto();
  setInterval(fetchCrypto, 30000);
}

/* ================= USERNAME ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  const el = document.getElementById("usernameDisplay");

  if (snap.exists()) {
    el.innerText = snap.data().username || "Not set";
  }
}

/* ================= RESET ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  log("Password reset sent");
};

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  onSnapshot(collection(db, "notifications", user.uid, "items"),
    (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === "added") {
          log(change.doc.data().text, "#ccc");
        }
      });
    },
    (err) => log("Notif error: " + err.message, "#ff4d4d")
  );
}

/* ================= ADS ================= */
function monitorAdRequests() {
  const q = query(
    collection(db, "adRequests"),
    where("userId", "==", user.uid)
  );

  onSnapshot(q,
    (snap) => {
      snap.forEach(d => {
        const ad = d.data();

        if (ad.status === "approved") log("Ad approved", "#00ff88");
        if (ad.status === "pending") log("Ad pending", "#ffaa00");
        if (ad.status === "rejected") log("Ad rejected", "#ff4d4d");
      });
    },
    (err) => log("Ad error: " + err.message, "#ff4d4d")
  );
}

/* ================= FRIENDS ================= */
function loadFriendRequests() {}
function loadFriends() {}