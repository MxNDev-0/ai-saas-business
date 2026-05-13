/* =========================================
   MCN COMMAND ENGINE v1
   Backend-style admin terminal
========================================= */

import { db } from "../firebase.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   TERMINAL STATE
========================= */

let terminalOpen = false;

/* =========================
   TERMINAL UI
========================= */

function createTerminal() {

  const terminal =
    document.createElement("div");

  terminal.id = "mcnTerminal";

  terminal.style.cssText = `
    position:fixed;
    bottom:10px;
    left:10px;
    width:340px;
    height:420px;
    background:#05070f;
    color:#00ff88;
    border:1px solid #1c2541;
    border-radius:14px;
    z-index:999999;
    overflow:hidden;
    font-family:monospace;
    box-shadow:0 0 30px rgba(0,0,0,0.5);
    display:none;
  `;

  terminal.innerHTML = `

    <div style="
      padding:10px;
      background:#0b132b;
      border-bottom:1px solid #222;
      font-weight:bold;
    ">
      🧠 MCN COMMAND ENGINE
    </div>

    <div id="terminalOutput"
      style="
        height:320px;
        overflow-y:auto;
        padding:10px;
        font-size:12px;
      ">
    </div>

    <div style="
      padding:10px;
      border-top:1px solid #222;
    ">

      <input
        id="terminalInput"
        placeholder="Enter command..."
        style="
          width:100%;
          background:#111;
          border:none;
          outline:none;
          color:#00ff88;
          padding:10px;
          border-radius:8px;
          box-sizing:border-box;
        "
      >

    </div>
  `;

  document.body.appendChild(terminal);

  const input =
    document.getElementById("terminalInput");

  input.addEventListener("keydown", async (e) => {

    if (e.key !== "Enter") return;

    const cmd = input.value.trim();

    if (!cmd) return;

    printLine("> " + cmd);

    input.value = "";

    await executeCommand(cmd);
  });
}

/* =========================
   TOGGLE TERMINAL
========================= */

function initTerminalToggle() {

  document.addEventListener("keydown", (e) => {

    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === "m"
    ) {

      terminalOpen = !terminalOpen;

      const terminal =
        document.getElementById("mcnTerminal");

      if (!terminal) return;

      terminal.style.display =
        terminalOpen ? "block" : "none";
    }
  });
}

/* =========================
   PRINT
========================= */

function printLine(text, type = "normal") {

  const out =
    document.getElementById("terminalOutput");

  if (!out) return;

  const div =
    document.createElement("div");

  div.style.marginBottom = "8px";

  if (type === "error") {
    div.style.color = "#ff4d4d";
  }

  if (type === "warn") {
    div.style.color = "#ffaa00";
  }

  div.textContent = text;

  out.appendChild(div);

  out.scrollTop = out.scrollHeight;
}

/* =========================
   COMMAND EXECUTOR
========================= */

async function executeCommand(command) {

  const cmd =
    command.toLowerCase();

  /* =========================
     HELP
  ========================= */

  if (cmd === "/help") {

    printLine("Available Commands:");

    printLine("/maintenance on");
    printLine("/maintenance off");

    printLine("/emergency on");
    printLine("/emergency off");

    printLine("/system health");
    printLine("/system status");

    printLine("/clear");

    return;
  }

  /* =========================
     CLEAR
  ========================= */

  if (cmd === "/clear") {

    const out =
      document.getElementById("terminalOutput");

    if (out) out.innerHTML = "";

    return;
  }

  /* =========================
     MAINTENANCE
  ========================= */

  if (cmd === "/maintenance on") {

    await setDoc(
      doc(db, "system", "maintenance"),
      {
        enabled: true,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    printLine("🛠 Maintenance Enabled");

    return;
  }

  if (cmd === "/maintenance off") {

    await setDoc(
      doc(db, "system", "maintenance"),
      {
        enabled: false,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    printLine("✅ Maintenance Disabled");

    return;
  }

  /* =========================
     EMERGENCY
  ========================= */

  if (cmd === "/emergency on") {

    await setDoc(
      doc(db, "system", "emergency"),
      {
        enabled: true,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    printLine("🚨 Emergency Mode Enabled");

    return;
  }

  if (cmd === "/emergency off") {

    await setDoc(
      doc(db, "system", "emergency"),
      {
        enabled: false,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    printLine("🟢 Emergency Mode Disabled");

    return;
  }

  /* =========================
     SYSTEM STATUS
  ========================= */

  if (cmd === "/system status") {

    try {

      const maint =
        await getDoc(
          doc(db, "system", "maintenance")
        );

      const emergency =
        await getDoc(
          doc(db, "system", "emergency")
        );

      printLine(
        "Maintenance: " +
        (maint.data()?.enabled
          ? "ON"
          : "OFF")
      );

      printLine(
        "Emergency: " +
        (emergency.data()?.enabled
          ? "ON"
          : "OFF")
      );

    } catch (err) {

      printLine(
        "Status fetch failed",
        "error"
      );
    }

    return;
  }

  /* =========================
     SYSTEM HEALTH
  ========================= */

  if (cmd === "/system health") {

    const memory =
      performance.memory
        ? Math.round(
            performance.memory.usedJSHeapSize
            / 1048576
          ) + "MB"
        : "Unavailable";

    printLine(
      "RAM Usage: " + memory
    );

    printLine(
      "Browser: " + navigator.userAgent
    );

    printLine(
      "Online: " + navigator.onLine
    );

    return;
  }

  /* =========================
     UNKNOWN
  ========================= */

  printLine(
    "Unknown command",
    "error"
  );
}

/* =========================
   BOOT
========================= */

createTerminal();

initTerminalToggle();

printLine("🧠 MCN Command Engine Ready");

printLine("Press CTRL + SHIFT + M");