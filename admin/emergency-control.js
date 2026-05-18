/* =========================================
🚨 MCN GLOBAL EMERGENCY CONTROL
========================================= */

import {
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";

let emergencyMode = false;

/* =========================================
BOOT BUTTON
========================================= */

function bootEmergencyControl() {

  if (document.getElementById("mcnEmergencyFab")) return;

  const fab = document.createElement("button");

  fab.id = "mcnEmergencyFab";
  fab.innerHTML = "🚨";

  fab.style.cssText = `
    position:fixed;
    bottom:90px;
    right:20px;
    width:60px;
    height:60px;
    border:none;
    border-radius:50%;
    background:#ff3b30;
    color:white;
    font-size:24px;
    z-index:999999;
    cursor:pointer;
    box-shadow:0 0 20px rgba(0,0,0,.4);
  `;

  fab.onclick = async () => {
    emergencyMode = !emergencyMode;

    try {
      await setDoc(
        doc(db, "system", "emergency"),
        {
          enabled: emergencyMode,
          updatedAt: Date.now()
        },
        { merge: true }
      );

      alert(
        emergencyMode
          ? "🚨 Emergency Mode Activated"
          : "✅ Emergency Mode Disabled"
      );

      console.log("Emergency:", emergencyMode);

    } catch (err) {
      console.error(err);
      alert("Emergency sync failed");
    }
  };

  document.body.appendChild(fab);
}

/* =========================================
REALTIME STATE WATCHER
========================================= */

function watchEmergencyState() {

  onSnapshot(
    doc(db, "system", "emergency"),
    (snap) => {

      const data = snap.data();

      emergencyMode = data?.enabled || false;

      console.log("🚨 Emergency Synced:", emergencyMode);

      /* OPTIONAL UI EFFECT */
      document.body.style.filter =
        emergencyMode ? "grayscale(.2)" : "none";
    }
  );
}

bootEmergencyControl();
watchEmergencyState();