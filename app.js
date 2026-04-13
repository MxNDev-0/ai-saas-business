import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const message = document.getElementById("message");

// SIGNUP
window.signup = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    message.innerText = "Account created!";
    window.location.href = "dashboard.html"; // ✅ manual redirect
  } catch (err) {
    message.innerText = err.message;
  }
};

// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    message.innerText = "Login successful!";
    window.location.href = "dashboard.html"; // ✅ manual redirect
  } catch (err) {
    message.innerText = err.message;
  }
};