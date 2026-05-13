/* =========================================
   MCN ADMIN AUTH
========================================= */

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.__MCN_ADMIN_AUTH = false;

onAuthStateChanged(auth, async (user) => {

  try {

    if (!user) {

      location.href = "./index.html";
      return;
    }

    const snap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    if (!snap.exists()) {

      location.href = "./index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {

      location.href = "./dashboard.html";
      return;
    }

    console.log("✅ Admin Auth Passed");

    window.__MCN_ADMIN_AUTH = true;

  } catch (err) {

    console.error("ADMIN AUTH ERROR:", err);

    location.href = "./index.html";
  }

});