import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= SAFE INIT ================= */
function getEmail() {
  return document.getElementById("email")?.value?.trim();
}

function getPassword() {
  return document.getElementById("password")?.value?.trim();
}

/* ================= ENSURE GLOBAL ACCESS ================= */
function attachHandlers() {

  window.signup = async function () {

    const email = getEmail();
    const password = getPassword();

    if (!email || !password) {
      alert("Fill all fields");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      alert("Account created");

      window.location.href = "dashboard.html";

    } catch (err) {
      alert(err.message);
    }
  };

  window.login = async function () {

    const email = getEmail();
    const password = getPassword();

    if (!email || !password) {
      alert("Fill all fields");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert("Login successful");

      window.location.href = "dashboard.html";

    } catch (err) {
      alert(err.message);
    }
  };
}

/* ================= FORCE RUN ================= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachHandlers);
} else {
  attachHandlers();
}