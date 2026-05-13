/* =========================================
   MCN HIDDEN MONITOR
========================================= */

const hiddenLogs = [];

window.hiddenMonitor = {

  log(message, type = "info") {

    hiddenLogs.push({
      type,
      message,
      time: Date.now()
    });

    console.log(
      `[MCN-${type.toUpperCase()}]`,
      message
    );
  },

  getLogs() {
    return hiddenLogs;
  },

  clearLogs() {

    hiddenLogs.length = 0;

    console.log("🧹 Hidden logs cleared");
  }
};

/* ================= AUTO MONITOR ================= */

window.addEventListener("error", (e) => {

  hiddenMonitor.log(
    e.message,
    "error"
  );
});

window.addEventListener(
  "unhandledrejection",
  (e) => {

    hiddenMonitor.log(
      e.reason?.message || "Promise rejection",
      "warn"
    );
  }
);

hiddenMonitor.log(
  "🧠 Hidden monitor active"
);