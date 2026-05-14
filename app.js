/* ================= IMPORT ================= */
import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* 🔔 PUSH IMPORTS */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

/* ================= PUSH CONFIG ================= */
const firebaseConfigPush = {
  apiKey: "AIzaSyAu8BaL9NV6NU_oKSy-pxh89TuVrovZzaE",
  authDomain: "ai-saas-business-ecfab.firebaseapp.com",
  projectId: "ai-saas-business-ecfab",
  messagingSenderId: "568523173235",
  appId: "1:568523173235:web:b714d052976268f1e72906"
};

const pushApp = initializeApp(firebaseConfigPush, "pushApp");
const messaging = getMessaging(pushApp);

/* ================= MESSAGE UI ================= */
function showMessage(text, color = "#5bc0be") {
  let msg = document.getElementById("authMessage");

  if (!msg) {
    msg = document.createElement("div");
    msg.id = "authMessage";
    msg.style.marginTop = "10px";
    msg.style.fontSize = "14px";
    document.querySelector(".center-box")?.appendChild(msg);
  }

  msg.style.color = color;
  msg.innerText = text;
}

/* ================= BUTTON LOADING ================= */
function setLoading(btn, state, text) {
  if (!btn) return;

  if (state) {
    btn.disabled = true;
    btn.dataset.original = btn.innerText;
    btn.innerText = text || "Processing...";
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.innerText = btn.dataset.original || "Submit";
    btn.style.opacity = "1";
  }
}

/* ================= PUSH INIT ================= */
async function initPush() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {

      const token = await getToken(messaging, {
        vapidKey: "BMtRVhjhwqYJ9Gn5Imp5ZuqdeY_N4lX9mUiGg9uJoHl3-kH2b5vXTG6cp1zAtAxZe3eOLviglmOklScCIBWFIm4"
      });

      fetch("https://mxm-backend.onrender.com/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
    }

  } catch (err) {
    console.log("Push error:", err);
  }
}

/* ================= FOREGROUND NOTIFICATION ================= */
onMessage(messaging, (payload) => {
  alert(payload.notification?.title + " - " + payload.notification?.body);
});

/* ================= SIGNUP (FIXED) ================= */
window.signup = async function () {

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const btn = document.querySelector("button.secondary-btn");

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Creating...";
    }

    await createUserWithEmailAndPassword(auth, email, password);

    alert("Account created successfully!");

    initPush();

    document.getElementById("loginModal").style.display = "none";
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }

  if (btn) {
    btn.disabled = false;
    btn.innerText = "Create Account";
  }
};

/* ================= LOGIN (FIXED) ================= */
window.login = async function () {

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const btn = document.querySelectorAll("button")[1];

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Logging in...";
    }

    await signInWithEmailAndPassword(auth, email, password);

    alert("Login successful!");

    initPush();

    document.getElementById("loginModal").style.display = "none";
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }

  if (btn) {
    btn.disabled = false;
    btn.innerText = "Login";
  }
};