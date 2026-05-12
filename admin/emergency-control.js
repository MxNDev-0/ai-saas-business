/* =========================================
   MCN EMERGENCY CONTROL SYSTEM v1
========================================= */

import { db } from "../firebase.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let emergencyState = false;

/* ================= INIT ================= */

async function loadState() {

  const snap =
    await getDoc(doc(db, "system", "emergency"));

  if (!snap.exists()) {

    await setDoc(doc(db, "system", "emergency"), {
      enabled: false,
      updatedAt: Date.now()
    });
  }

  emergencyState =
    snap.exists() ? snap.data().enabled : false;

  renderUI();
}

/* ================= ACTIONS ================= */

async function setEmergency(state) {

  emergencyState = state;

  await setDoc(doc(db, "system", "emergency"), {
    enabled: state,
    updatedAt: Date.now()
  }, { merge: true });

  console.log(
    state
      ? "🚨 EMERGENCY ACTIVATED"
      : "🟢 EMERGENCY DISABLED"
  );

  renderUI();
}

/* ================= UI CONTROLLER ================= */

function renderUI() {

  let panel = document.getElementById("emergencyPanel");

  if (!panel) {

    panel = document.createElement("div");

    panel.id = "emergencyPanel";

    panel.style.cssText = `
      position:fixed;
      top:50%;
      left:10px;
      transform:translateY(-50%);
      background:#1c2541;
      color:white;
      padding:10px;
      border-radius:12px;
      z-index:999999;
      width:160px;
      font-family:Arial;
      box-shadow:0 0 20px rgba(0,0,0,0.4);
    `;

    panel.innerHTML = `
      <b>🚨 Emergency Control</b>
      <hr style="border:0;border-top:1px solid #444">

      <button id="emOn">ACTIVATE</button>
      <button id="emOff" style="margin-top:5px;background:red;color:white;">
        DISABLE
      </button>

      <p id="emStatus" style="margin-top:10px;font-size:12px;">
      Status: UNKNOWN
      </p>
    `;

    document.body.appendChild(panel);

    document.getElementById("emOn").onclick =
      () => setEmergency(true);

    document.getElementById("emOff").onclick =
      () => setEmergency(false);
  }

  const status =
    document.getElementById("emStatus");

  if (status) {

    status.textContent =
      "Status: " +
      (emergencyState ? "ACTIVE 🚨" : "NORMAL 🟢");
  }
}

/* ================= BOOT ================= */

loadState();