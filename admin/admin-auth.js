/* =========================================
   MCN ADMIN AUTH GUARD v1
   MUST LOAD BEFORE admin.js
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   HARD UI LOCK (PREVENT FLASH)
================================= */

document.body.style.display = "none";

/* ===============================
   AUTH GUARD
================================= */

function failRedirect(message, url = "../index.html") {

  console.warn("[ADMIN AUTH]", message);

  sessionStorage.removeItem("mcn_admin_ok");

  location.href = url;
}

/* ===============================
   MAIN CHECK
================================= */

onAuthStateChanged(auth, async (user) => {

  try {

    /* ❌ NO USER */
    if (!user) {
      failRedirect("No user logged in");
      return;
    }

    const snap = await getDoc(
      doc(db, "users", user.uid)
    );

    /* ❌ USER NOT FOUND */
    if (!snap.exists()) {
      failRedirect("User doc missing");
      return;
    }

    const data = snap.data();

    /* ❌ NOT ADMIN */
    if (data.role !== "admin") {
      failRedirect("Not admin user", "../dashboard.html");
      return;
    }

    /* ===============================
       SUCCESS → ADMIN APPROVED
    ================================= */

    sessionStorage.setItem("mcn_admin_ok", "true");

    console.log("🧠 ADMIN AUTH VERIFIED");

    document.body.style.display = "block";

  } catch (err) {

    console.error("[ADMIN AUTH ERROR]", err);

    failRedirect("Auth system error");
  }
});

/* ===============================
   EXTRA SAFETY (ANTI DIRECT BYPASS)
================================= */

setTimeout(() => {

  if (!sessionStorage.getItem("mcn_admin_ok")) {

    failRedirect("Auth timeout fallback");

  } else {

    document.body.style.display = "block";
  }

}, 5000);