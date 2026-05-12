import { auth, db } from "../firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   EMERGENCY STATE
================================= */

let emergencyActive = false;
let emergencyReason = "";
let emergencyMode = "safe";

/* ===============================
   UI LOGGER (optional reuse admin monitor if exists)
================================= */

function log(msg, type = "info") {

  const box = document.getElementById("monitor");

  if (!box) {
    console.log("[MCN EMERGENCY]", msg);
    return;
  }

  const color =
    type === "danger"
      ? "#ff3b3b"
      : type === "warn"
      ? "#ffaa00"
      : "#00ff88";

  const div = document.createElement("div");

  div.style.color = color;

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;
}

/* ===============================
   CHECK EMERGENCY STATE
================================= */

export async function checkEmergencyState() {

  try {

    const snap = await getDoc(
      doc(db, "system", "emergency")
    );

    if (!snap.exists()) return;

    const data = snap.data();

    if (data.lockdown === true) {

      emergencyActive = true;
      emergencyReason = data.reason || "unknown";
      emergencyMode = data.mode || "hard";

      activateEmergencyUI();
    }

  } catch (err) {

    console.error(err);
    log("Emergency check failed", "warn");
  }
}

/* ===============================
   ACTIVATE EMERGENCY MODE
================================= */

function activateEmergencyUI() {

  log("🚨 EMERGENCY MODE ACTIVE", "danger");

  /* FULL SCREEN LOCK BANNER */
  const overlay = document.createElement("div");

  overlay.id = "mcnEmergencyOverlay";

  overlay.style.cssText = `
    position:fixed;
    top:0;
    left:0;
    width:100%;
    height:100%;
    background:#0b132b;
    color:#ff3b3b;
    display:flex;
    justify-content:center;
    align-items:center;
    flex-direction:column;
    z-index:99999999;
    text-align:center;
    padding:20px;
    font-family:Arial;
  `;

  overlay.innerHTML = `

    <h1>🚨 SYSTEM LOCKDOWN</h1>

    <p style="max-width:500px;opacity:0.8;line-height:1.6">
      MCN Engine is currently in emergency mode.
    </p>

    <p><b>Reason:</b> ${emergencyReason}</p>

    <p><b>Mode:</b> ${emergencyMode}</p>

    <div style="margin-top:20px;font-size:12px;opacity:0.6">
      Only administrators can restore system access
    </div>

  `;

  document.body.appendChild(overlay);
}

/* ===============================
   ACTIVATE EMERGENCY (ADMIN ONLY)
================================= */

export async function triggerEmergency({
  reason = "manual trigger",
  mode = "hard"
}) {

  try {

    const user = auth.currentUser;

    if (!user) return;

    /* verify admin */
    const snap = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!snap.exists() || snap.data().role !== "admin") {
      log("Unauthorized emergency attempt", "danger");
      return;
    }

    await setDoc(
      doc(db, "system", "emergency"),
      {
        lockdown: true,
        reason,
        mode,
        triggeredBy: user.uid,
        timestamp: serverTimestamp()
      }
    );

    log("🚨 Emergency triggered", "danger");

    checkEmergencyState();

  } catch (err) {

    console.error(err);
    log("Emergency trigger failed", "danger");
  }
}

/* ===============================
   DISABLE EMERGENCY (RECOVERY)
================================= */

export async function disableEmergency() {

  try {

    const user = auth.currentUser;

    if (!user) return;

    const snap = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!snap.exists() || snap.data().role !== "admin") {
      log("Unauthorized restore attempt", "danger");
      return;
    }

    await setDoc(
      doc(db, "system", "emergency"),
      {
        lockdown: false,
        reason: "",
        mode: "safe",
        restoredBy: user.uid,
        timestamp: serverTimestamp()
      },
      { merge: true }
    );

    log("✅ Emergency disabled", "info");

    location.reload();

  } catch (err) {

    console.error(err);
    log("Restore failed", "danger");
  }
}

/* ===============================
   AUTO INIT
================================= */

checkEmergencyState();