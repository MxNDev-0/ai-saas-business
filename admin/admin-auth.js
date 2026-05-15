import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   GLOBAL FLAGS
========================================= */

window.__MCN_ADMIN_AUTH = false;
window.MCN_ADMIN = null;
window.MCN_ADMIN_TOKEN = null;

/* =========================================
   ADMIN GUARD (SAFE + ANTI SPOOF)
========================================= */

export function initAdminGuard(callback) {

  onAuthStateChanged(auth, async (user) => {

    try {

      if (!user) {
        console.log("❌ No user session");
        location.href = "../index.html";
        return;
      }

      console.log("✅ User detected:", user.email);

      /* =========================================
         TOKEN CHECK (ANTI SPOOF LAYER)
      ========================================= */

      const token = await user.getIdTokenResult(true);

      // If custom claims exist → strongest security path
      if (token?.claims?.admin === true) {

        console.log("🔐 Admin verified via token");

        window.__MCN_ADMIN_AUTH = true;
        window.MCN_ADMIN = user;
        window.MCN_ADMIN_TOKEN = token;

        callback(user);
        return;
      }

      /* =========================================
         FALLBACK: FIRESTORE ROLE CHECK
         (for console-based admin setup)
      ========================================= */

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        console.log("❌ User document missing");
        location.href = "../index.html";
        return;
      }

      const data = snap.data();

      console.log("🧠 User role:", data.role);

      if (data.role !== "admin") {
        console.log("❌ Not an admin");
        location.href = "../dashboard.html";
        return;
      }

      /* =========================================
         AUTH SUCCESS (FALLBACK MODE)
      ========================================= */

      window.__MCN_ADMIN_AUTH = true;
      window.MCN_ADMIN = user;
      window.MCN_ADMIN_TOKEN = token;

      console.log("⚠ Admin verified via Firestore (fallback)");

      callback(user);

    } catch (err) {

      console.error("ADMIN AUTH ERROR:", err);
      location.href = "../index.html";
    }

  });
}