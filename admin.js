import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
  getDocs,
  writeBatch,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ================= 🔒 ADMIN ACCESS GUARD (FIXED) ================= */
const ADMIN_UID = null; 
// ⚠️ OPTIONAL: put your UID here later for absolute lock
// example: "pmXooqSVxdO53xiCugrqDijR6iI3"

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  // fetch user role
  const snap = await getDoc(doc(db, "users", user.uid));

  const role = snap.exists() ? snap.data().role : "user";

  // 🔥 SAFE ADMIN CHECK (role OR UID)
  if (
    (ADMIN_UID && user.uid === ADMIN_UID) ||
    role === "admin"
  ) {
    console.log("Admin access granted");
  } else {
    alert("❌ Access denied (Admin only)");
    location.href = "dashboard.html";
    return;
  }
});


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
        <div style="padding:6px;margin:5px;background:#1c2541;border-radius:6px;">
          <b>${u.email || u.username || "user"}</b>
          <button onclick="banUser('${u.uid}')">Ban</button>
        </div>
      `;
    });
  });
}


/* ================= BAN USER ================= */
window.banUser = async (uid) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      banned: true
    });

    alert("User banned ❌");
  } catch (err) {
    console.error(err);
    alert("Failed to ban user");
  }
};


/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div style="padding:6px;margin:5px;background:#0b132b;border-radius:6px;">
          <b>${p.user || "user"}</b>
          <p>${p.text || ""}</p>
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}


/* ================= DELETE SINGLE POST ================= */
window.deletePost = async (id) => {
  try {
    await deleteDoc(doc(db, "posts", id));
  } catch (err) {
    console.error(err);
    alert("Failed to delete post");
  }
};


/* ================= CLEAR ALL POSTS ================= */
window.clearAllPosts = async () => {
  try {
    const ok = confirm("⚠️ This will permanently delete ALL posts. Continue?");
    if (!ok) return;

    const snap = await getDocs(collection(db, "posts"));

    if (snap.empty) {
      alert("No posts found");
      return;
    }

    const batch = writeBatch(db);

    snap.forEach((docSnap) => {
      batch.delete(doc(db, "posts", docSnap.id));
    });

    await batch.commit();

    alert("✅ All posts deleted successfully!");

  } catch (err) {
    console.error(err);
    alert("❌ Failed to clear posts");
  }
};


/* ================= UPGRADE REQUESTS ================= */
function loadUpgrades() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "upgradeRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:6px;margin:5px;background:#1c2541;border-radius:6px;">
          <b>${u.email || "user"}</b>
          <p>Status: ${u.status || "pending"}</p>
          <button onclick="approveUpgrade('${u.uid}')">Approve</button>
        </div>
      `;
    });
  });
}


/* ================= APPROVE UPGRADE ================= */
window.approveUpgrade = async (uid) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      premium: true,
      upgradedAt: Date.now()
    });

    await updateDoc(doc(db, "upgradeRequests", uid), {
      status: "approved"
    });

    alert("User upgraded ✅");
  } catch (err) {
    console.error(err);
    alert("Upgrade failed");
  }
};


/* ================= INIT ================= */
loadUsers();
loadPosts();
loadUpgrades();