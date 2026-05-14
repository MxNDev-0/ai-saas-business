/* =========================================
   MCN ADMIN AUTH V3
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   GLOBAL ADMIN FLAG
========================================= */

window.__MCN_ADMIN_AUTH = false;

/* =========================================
   AUTH CHECK
========================================= */

onAuthStateChanged(auth, async (user) => {

  try {

    if (!user) {

      console.log("❌ No user session");

      location.href = "../index.html";

      return;
    }

    console.log("✅ User detected:", user.email);

    const userRef = doc(
      db,
      "users",
      user.uid
    );

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

    /* ✅ AUTH SUCCESS */

    window.__MCN_ADMIN_AUTH = true;

    console.log("✅ Admin authenticated");

  } catch (err) {

    console.error(
      "ADMIN AUTH ERROR:",
      err
    );

    location.href = "../index.html";
  }

});