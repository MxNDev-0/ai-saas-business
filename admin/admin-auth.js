/* =========================================
   MCN ADMIN AUTH
========================================= */

import { auth } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

  if (!user) {

    console.log("❌ Not logged in");

    location.href = "../index.html";

    return;
  }

  console.log("✅ Admin authenticated");

});