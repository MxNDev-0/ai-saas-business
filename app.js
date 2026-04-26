/* ================= IMPORT ================= */
import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* 🔔 PUSH IMPORTS (NEW) */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

/* 🔥 FIREBASE CONFIG (FOR PUSH ONLY) */
const firebaseConfigPush = {
  apiKey: "AIzaSyAu8BaL9NV6NU_oKSy-pxh89TuVrovZzaE",
  authDomain: "ai-saas-business-ecfab.firebaseapp.com",
  projectId: "ai-saas-business-ecfab",
  messagingSenderId: "568523173235",
  appId: "1:568523173235:web:b714d052976268f1e72906"
};

/* 🔔 INIT PUSH */
const pushApp = initializeApp(firebaseConfigPush, "pushApp");
const messaging = getMessaging(pushApp);

/* ================= UI ELEMENT ================= */
function showMessage(text, color = "#5bc0be") {
  let msg = document.getElementById("authMessage");

  if (!msg) {
    msg = document.createElement("div");
    msg.id = "authMessage";
    msg.style.marginTop = "10px";
    msg.style.fontSize = "14px";
    document.querySelector(".center-box").appendChild(msg);
  }

  msg.style.color = color;
  msg.innerText = text;
}

/* ================= BUTTON STATE ================= */
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

/* ================= 🔔 INIT PUSH FUNCTION ================= */
async function initPush() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("✅ Notification allowed");

      const token = await getToken(messaging, {
        vapidKey: "BMtRVhjhwqYJ9Gn5Imp5ZuqdeY_N4lX9mUiGg9uJoHl3-kH2b5vXTG6cp1zAtAxZe3eOLviglmOklScCIBWFIm4"
      });

      console.log("🔑 USER TOKEN:", token);

      /* OPTIONAL: SEND TOKEN TO BACKEND */
      fetch("https://mxm-backend.onrender.com/save-token", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ token })
      });

    } else {
      console.log("❌ Notification permission denied");
    }

  } catch (err) {
    console.error("Push error:", err);
  }
}

/* 🔔 FOREGROUND NOTIFICATION */
onMessage(messaging, (payload) => {
  alert(payload.notification.title + " - " + payload.notification.body);
});

/* ================= SIGNUP ================= */
window.signup = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const btn = event.target;

  if (!email || !password) {
    return showMessage("Please fill all fields", "#ff6b6b");
  }

  setLoading(btn, true, "Creating account...");

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    showMessage("Account created successfully!", "#00ff88");

    /* 🔔 INIT PUSH AFTER SIGNUP */
    initPush();

    setTimeout(() => {
      document.getElementById("loginModal").style.display = "none";
      window.location.href = "dashboard.html";
    }, 1200);

  } catch (err) {
    showMessage(err.message, "#ff6b6b");
  }

  setLoading(btn, false);
};

/* ================= LOGIN ================= */
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const btn = event.target;

  if (!email || !password) {
    return showMessage("Please fill all fields", "#ff6b6b");
  }

  setLoading(btn, true, "Logging in...");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    showMessage("Login successful!", "#00ff88");

    /* 🔔 INIT PUSH AFTER LOGIN */
    initPush();

    setTimeout(() => {
      document.getElementById("loginModal").style.display = "none";
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (err) {
    showMessage(err.message, "#ff6b6b");
  }

  setLoading(btn, false);
};