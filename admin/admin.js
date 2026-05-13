/* =========================================
   MCN ADMIN AI v7 — MOBILE FIX EDITION
========================================= */

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   SYSTEM STATE
========================================= */

let systemHealth = 100;
let emergencyMode = false;

/* =========================================
   LOG ENGINE
========================================= */

function aiLog(msg, type = "ok") {

  const box = document.getElementById("monitor");

  if (!box) return;

  const div = document.createElement("div");

  div.style.color =
    type === "error"
      ? "#ff4d4d"
      : "#00ff88";

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;

  updateDiagnostics();
}

/* =========================================
   AUTH
========================================= */

onAuthStateChanged(auth, async(user)=>{

  if(!user){

    location.href = "../index.html";
    return;

  }

  try{

    const snap =
      await getDoc(
        doc(db,"users",user.uid)
      );

    if(!snap.exists()){

      location.href="../index.html";
      return;

    }

    const data = snap.data();

    if(data.role !== "admin"){

      location.href="../dashboard.html";
      return;

    }

    aiLog("🧠 Admin Core Activated");

    loadPosts();
    loadUsers();
    loadAds();

    initDiagnostics();
    initEmergencyControl();

  }catch(err){

    console.error(err);

    aiLog(
      "Auth Failure",
      "error"
    );
  }

});

/* =========================================
   🚨 EMERGENCY CONTROL
========================================= */

function initEmergencyControl(){

  if(document.getElementById("emergencyFab"))
    return;

  const wrapper =
    document.createElement("div");

  wrapper.id = "emergencyFab";

  wrapper.style.cssText = `
    position:fixed;
    bottom:20px;
    left:15px;
    z-index:999999;
  `;

  wrapper.innerHTML = `

    <button id="emergencyToggle"
      style="
        width:60px;
        height:60px;
        border:none;
        border-radius:50%;
        background:#ff3b30;
        color:white;
        font-size:24px;
        box-shadow:0 0 20px rgba(0,0,0,.4);
      ">
      🚨
    </button>

    <div id="emergencyPanel"
      style="
        display:none;
        margin-top:12px;
        width:230px;
        background:#1c2541;
        border-radius:18px;
        padding:15px;
        color:white;
        box-shadow:0 0 20px rgba(0,0,0,.4);
      ">

      <h3 style="margin-top:0;">
        Emergency Control
      </h3>

      <button id="activateEmergency"
        style="
          width:100%;
          padding:14px;
          border:none;
          border-radius:12px;
          background:#5bc0be;
          color:black;
          font-weight:bold;
          margin-bottom:10px;
        ">
        ACTIVATE
      </button>

      <button id="disableEmergencyBtn"
        style="
          width:100%;
          padding:14px;
          border:none;
          border-radius:12px;
          background:red;
          color:white;
          font-weight:bold;
        ">
        DISABLE
      </button>

      <div id="emergencyStatus"
        style="
          margin-top:10px;
          font-size:13px;
          opacity:.8;
        ">
        Status: NORMAL
      </div>

    </div>
  `;

  document.body.appendChild(wrapper);

  const toggle =
    document.getElementById(
      "emergencyToggle"
    );

  const panel =
    document.getElementById(
      "