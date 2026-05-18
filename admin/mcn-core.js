/* =========================================
   🧠 MCN OS KERNEL v2
   Modular Kernel + Registry + Snapshots + Fault Isolation
========================================= */

/* ================= KERNEL STATE ================= */

window.MCN_KERNEL = {
  version: "v2",
  bootTime: Date.now(),

  modules: {},
  snapshots: [],

  status: {
    mode: "stable",
    lastFault: null
  }
};

window.MCN_SYSTEM = window.MCN_SYSTEM || {
  health: 100,
  stats: {
    posts: 0,
    users: 0,
    supportChats: 0,
    errorCount: 0,
    lastEvent: null
  },
  flags: {
    emergency: false,
    degraded: false,
    autopilot: true
  }
};

window.MCN_AI = window.MCN_AI || {
  mode: "stable",
  risk: 0,
  insights: []
};

window.MCN_FUNCTIONS = window.MCN_FUNCTIONS || { registry: {} };

/* ================= MODULE REGISTRY ================= */

function registerModule(name, moduleFn) {

  window.MCN_KERNEL.modules[name] = {
    fn: moduleFn,
    status: "active",
    lastRun: 0,
    errors: 0
  };
}

/* ================= SAFE EXECUTOR ================= */

function safeRun(name) {

  const mod = window.MCN_KERNEL.modules[name];

  if (!mod) return;

  try {
    mod.fn();
    mod.status = "active";
    mod.lastRun = Date.now();

  } catch (err) {

    mod.errors++;
    mod.status = "failed";

    window.MCN_SYSTEM.stats.errorCount++;

    window.MCN_KERNEL.status.lastFault = {
      module: name,
      message: err.message,
      time: Date.now()
    };

    console.warn("🧠 KERNEL FAULT:", name, err.message);

    isolateModule(name);
  }
}

/* ================= MODULE ISOLATION ================= */

function isolateModule(name) {

  const mod = window.MCN_KERNEL.modules[name];

  if (!mod) return;

  mod.status = "isolated";

  console.warn("⚠ MODULE ISOLATED:", name);

  scheduleRollback(name);
}

/* ================= SNAPSHOT SYSTEM ================= */

function createSnapshot() {

  const snap = {
    time: Date.now(),
    system: JSON.parse(JSON.stringify(window.MCN_SYSTEM)),
    ai: JSON.parse(JSON.stringify(window.MCN_AI))
  };

  window.MCN_KERNEL.snapshots.push(snap);

  if (window.MCN_KERNEL.snapshots.length > 10) {
    window.MCN_KERNEL.snapshots.shift();
  }
}

/* ================= ROLLBACK SYSTEM ================= */

function rollbackLast() {

  const snap = window.MCN_KERNEL.snapshots.pop();

  if (!snap) return;

  window.MCN_SYSTEM = snap.system;
  window.MCN_AI = snap.ai;

  console.warn("🔁 SYSTEM ROLLBACK EXECUTED");
}

/* ================= AUTO ROLLBACK SCHEDULER ================= */

function scheduleRollback(name) {

  const mod = window.MCN_KERNEL.modules[name];

  if (!mod) return;

  setTimeout(() => {

    if (mod.status === "isolated") {
      console.warn("🔁 Attempting module recovery:", name);
      mod.status = "active";
    }

  }, 5000);
}

/* ================= CORE ENGINE ================= */

function kernelCycle() {

  /* create safety snapshot */
  createSnapshot();

  /* run all modules safely */
  for (let name in window.MCN_KERNEL.modules) {
    safeRun(name);
  }

  /* system health recalculation */
  const s = window.MCN_SYSTEM;

  let health = 100;

  if (s.flags.emergency) health -= 40;
  if (s.stats.errorCount > 5) health -= s.stats.errorCount * 5;

  s.health = Math.max(0, health);
  s.flags.degraded = s.health < 60;

  /* AI state */
  const ai = window.MCN_AI;

  ai.risk = s.stats.errorCount * 10;

  ai.mode =
    ai.risk > 70 ? "critical" :
    ai.risk > 40 ? "warning" :
    "stable";

  ai.insights = [];

  if (s.stats.errorCount > 5) {
    ai.insights.push("High error density detected");
  }

  if (s.health < 60) {
    ai.insights.push("System degradation detected");
  }
}

/* ================= KERNEL LOOP ================= */

setInterval(kernelCycle, 3000);

console.log("🧠 MCN OS KERNEL v2 ONLINE");