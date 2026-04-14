import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let deleting = false;

/* ================= WALLET ================= */
window.updateWallet = async () => {
  const balance = document.getElementById("balanceInput").value;

  await setDoc(doc(db, "wallet", "main"), {
    balance: Number(balance),
    updatedAt: Date.now()
  });

  alert("Wallet updated!");
};

/* ================= EARNINGS ================= */
window.addEarning = async () => {
  const source = document.getElementById("source").value;
  const amount = document.getElementById("amount").value;

  await addDoc(collection(db, "earningsLog"), {
    source,
    amount: Number(amount),
    date: Date.now()
  });

  alert("Earning added!");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:8px;margin:6px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <button onclick="toggleBan('${u.uid}', true)">Ban</button>
          <button onclick="toggleBan('${u.uid}', false)">Unban</button>
        </div>
      `;
    });
  });
}

/* ================= BAN / UNBAN ================= */
window.toggleBan = async (uid, status) => {
  await updateDoc(doc(db, "users", uid), {
    banned: status
  });

  alert(status ? "User banned ❌" : "User unbanned ✅");
};

/* ================= POSTS LIST ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div style="padding:8px;margin:6px;background:#0b132b;border-radius:6px;">
          <b>${p.user}</b>
          <p>${p.text}</p>
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

/* ================= DELETE SINGLE POST ================= */
window.deletePost = async (id) => {
  if (!confirm("Delete this post?")) return;

  try {
    await deleteDoc(doc(db, "posts", id));
    alert("Post deleted ✅");
  } catch (err) {
    console.error(err);
    alert("Failed to delete ❌");
  }
};

/* ================= DELETE ALL POSTS (ROBUST) ================= */
window.clearAllPosts = async () => {
  if (deleting) return;

  const ok = confirm("⚠️ Delete ALL posts permanently?");
  if (!ok) return;

  deleting = true;

  try {
    const snap = await getDocs(collection(db, "posts"));

    if (snap.empty) {
      alert("No posts found");
      deleting = false;
      return;
    }

    let count = 0;

    for (const d of snap.docs) {
      await deleteDoc(doc(db, "posts", d.id));
      count++;
    }

    alert(`Deleted ${count} posts ✅`);
  } catch (err) {
    console.error(err);
    alert("Error deleting posts ❌");
  }

  deleting = false;
};

/* ================= DELETE BY USER ================= */
window.deleteUserPosts = async (emailPrefix) => {
  if (!confirm(`Delete ALL posts from ${emailPrefix}?`)) return;

  const snap = await getDocs(collection(db, "posts"));

  let count = 0;

  for (const d of snap.docs) {
    const data = d.data();

    if (data.user === emailPrefix) {
      await deleteDoc(doc(db, "posts", d.id));
      count++;
    }
  }

  alert(`Deleted ${count} posts from ${emailPrefix} ✅`);
};

/* ================= CLEAN OLD POSTS ================= */
window.cleanOldPosts = async (days = 7) => {
  const limit = Date.now() - days * 24 * 60 * 60 * 1000;

  const snap = await getDocs(collection(db, "posts"));

  let count = 0;

  for (const d of snap.docs) {
    const data = d.data();

    if (data.time < limit) {
      await deleteDoc(doc(db, "posts", d.id));
      count++;
    }
  }

  alert(`Cleaned ${count} old posts 🧹`);
};

/* ================= UPGRADES ================= */
function loadUpgrades() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "upgradeRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:8px;margin:6px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <p>Status: ${u.status}</p>
          <button onclick="approveUpgrade('${u.uid}')">Approve</button>
        </div>
      `;
    });
  });
}

/* ================= APPROVE UPGRADE ================= */
window.approveUpgrade = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    premium: true
  });

  await updateDoc(doc(db, "upgradeRequests", uid), {
    status: "approved"
  });

  alert("User upgraded ✅");
};

/* ================= INIT ================= */
loadUsers();
loadPosts();
loadUpgrades();