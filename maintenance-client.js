import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig } from "./firebase.js";

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

/* ================= START LISTENING ================= */
onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
  watchMaintenance();
});

/* ================= FIRESTORE LISTENER ================= */
function watchMaintenance() {

  const ref = doc(db, "system", "maintenance");

  onSnapshot(ref, (snap) => {

    if (!snap.exists()) return;

    const data = snap.data();
    const now = Date.now();

    const inSchedule =
      (!data.startAt || now >= data.startAt) &&
      (!data.endAt || now <= data.endAt);

    const isAdminAllowed =
      currentUser &&
      data.allowedAdmins?.includes(currentUser.uid);

    const blocked =
      data.enabled &&
      inSchedule &&
      !isAdminAllowed;

    if (blocked) {
      showMaintenanceScreen(data);
    }
  });
}

/* ================= BLOCK SCREEN ================= */
function showMaintenanceScreen(data) {

  document.body.innerHTML = "";

  const box = document.createElement("div");

  box.style.cssText = `
    position:fixed;
    inset:0;
    background:${data.mode === "hard" ? "#000" : "#0b1320"};
    color:#fff;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    padding:20px;
    font-family:Arial;
    z-index:999999;
  `;

  box.innerHTML = `
    <h1>🛠 Maintenance Mode</h1>
    <p style="max-width:400px;">
      ${data.message || "MCN Engine is temporarily under maintenance."}
    </p>
  `;

  document.body.appendChild(box);
}