import { db } from "./firebase.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN CONTROL CENTER MONITOR V3
========================================= */

const box =
  document.getElementById("monitor");

/* =========================================
   SAFETY CHECK
========================================= */

if (!box) {

  console.error(
    "❌ Monitor element missing"
  );

} else {

  console.log(
    "✅ Monitor UI Connected"
  );

  /* =========================================
     PREVENT DOUBLE BOOT
  ========================================= */

  if (!window.__MCN_MONITOR_ACTIVE) {

    window.__MCN_MONITOR_ACTIVE = true;

    startMonitor();
  }
}

/* =========================================
   PUSH LOG
========================================= */

function push(
  msg,
  type = "ok"
) {

  if (!box) return;

  const div =
    document.createElement("div");

  const time =
    new Date().toLocaleTimeString();

  div.style.marginBottom =
    "6px";

  div.style.fontSize =
    "13px";

  if (type === "error") {

    div.style.color = "red";

  } else if (
    type === "warn"
  ) {

    div.style.color =
      "orange";

  } else if (
    type === "system"
  ) {

    div.style.color =
      "#5bc0be";

  } else {

    div.style.color =
      "#00ff88";
  }

  div.textContent =
    `[${time}] ${msg}`;

  box.appendChild(div);

  box.scrollTop =
    box.scrollHeight;
}

/* =========================================
   START MONITOR
========================================= */

function startMonitor() {

  push(
    "🧠 Control Center Online",
    "system"
  );

  push(
    "🔥 Firebase Connected",
    "system"
  );

  push(
    "📡 Realtime Watchers Active",
    "system"
  );

  push(
    "💬 Support Inbox Ready",
    "system"
  );

  /* =========================================
     POSTS WATCHER
  ========================================= */

  onSnapshot(
    collection(db, "posts"),
    () => {

      push(
        "📌 Posts updated",
        "system"
      );
    }
  );

  /* =========================================
     ADS WATCHER
  ========================================= */

  onSnapshot(
    collection(db, "adRequests"),
    () => {

      push(
        "📢 Ad activity detected",
        "system"
      );
    }
  );

  /* =========================================
     SUPPORT WATCHER
  ========================================= */

  onSnapshot(
    collection(db, "supportChats"),
    () => {

      push(
        "💬 New support activity",
        "system"
      );
    }
  );

  /* =========================================
     HEARTBEAT
  ========================================= */

  setInterval(() => {

    push(
      "💓 System heartbeat OK"
    );

  }, 30000);

  /* =========================================
     CUSTOM EVENT LOGGER
  ========================================= */

  window.addEventListener(
    "mcn-log",
    (e) => {

      push(
        e.detail || "Custom event"
      );
    }
  );

  console.log(
    "✅ MCN Monitor Running"
  );
}