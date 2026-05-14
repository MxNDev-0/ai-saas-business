/* =========================================
   MCN ADMIN AUTH SAFE VERSION
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("🧠 Admin auth booting...");

onAuthStateChanged(auth, async (user) => {

  try {

    if (!user) {

      console.log("❌ No user session");

      location.href = "../index.html";

      return;
    }

    console.log("✅ User detected:", user.uid);

    const userRef = doc(db, "users", user.uid);

    const snap = await getDoc(userRef);

    if (!snap.exists()) {

      console.log("❌ User document missing");

      location.href = "../dashboard.html";

      return;
    }

    const data = snap.data();

    console.log("🧠 Role:", data.role);

    if (data.role !== "admin") {

      console.log("❌ Not admin");

      location.href = "../dashboard.html";

      return;
    }

    console.log("✅ Admin authenticated");

  } catch (err) {

    console.error(
      "❌ Admin authentication failed:",
      err
    );

    document.body.innerHTML = `
      <div style="
        background:#0b132b;
        color:white;
        height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        font-family:Arial;
        text-align:center;
        padding:20px;
      ">
        <div>
          <h1>⚠ Admin Authentication Failed</h1>
          <p>${err.message}</p>
        </div>
      </div>
    `;
  }

});