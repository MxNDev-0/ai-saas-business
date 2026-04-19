import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.currentUser = null;
window.authReady = false;

/* ================= AUTH CORE ================= */
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.currentUser = null;
    window.authReady = true;
    return;
  }

  window.currentUser = user;
  window.authReady = true;

  console.log("AUTH READY:", user.uid);
});