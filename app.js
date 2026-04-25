import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= SAFE DOM ACCESS ================= */
function getVal(id){
  const el = document.getElementById(id);
  return el ? el.value : "";
}

/* ================= SIGNUP ================= */
window.signup = async function () {
  const email = getVal("email");
  const password = getVal("password");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created successfully");
    window.location.href = "dashboard.html";
  } catch (err) {
    alert(err.message);
  }
};

/* ================= LOGIN ================= */
window.login = async function () {
  const email = getVal("email");
  const password = getVal("password");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful");
    window.location.href = "dashboard.html";
  } catch (err) {
    alert(err.message);
  }
};