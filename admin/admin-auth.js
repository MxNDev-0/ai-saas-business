/* =========================================
   MCN ADMIN AUTH GATE (v1)
   - Pre-check security layer
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= CONFIG ================= */

const ADMIN_ONLY_PAGES = [
  "admin.html"
];

const REDIRECT_IF_FAIL = "dashboard.html";

/* ================= CORE GUARD ================= */

onAuthStateChanged(auth, async (user) => {

  const currentPage =
    location.pathname.split("/").pop();

  if (!ADMIN_ONLY_PAGES.includes(currentPage)) return;

  if (!user) {
    location.href = "index.html";
    return;
  }

  try {

    const snap =
      await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      location.href = REDIRECT_IF_FAIL;
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {

      console.warn("⛔ Admin access denied");

      location.href = REDIRECT_IF_FAIL;

      return;
    }

    console.log("🧠 Admin Auth Passed");

    window.__MCN_ADMIN_AUTH = true;

  } catch (err) {

    console.error("Auth error:", err);

    location.href = REDIRECT_IF_FAIL;
  }
});