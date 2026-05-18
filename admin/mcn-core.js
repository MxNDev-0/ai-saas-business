/* =========================================
🧠 MCN KERNEL v3.1 — UNIFIED DEPENDENCY SYSTEM
Single Source of Truth (NO DUPLICATION SAFE)
========================================= */

window.MCN_KERNEL = window.MCN_KERNEL || {
  version: "v3.1",

  modules: {},

  graph: {
    dependencies: {},
    dependents: {}
  },

  status: {
    mode: "stable",
    lastFault: null
  }
};

/* ================= SHARED SYSTEM STATE ================= */

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
  risk: 0
};

window.MCN_FUNCTIONS = window.MCN_FUNCTIONS || { registry: {} };

/* ================= MODULE REGISTRY ================= */

export function registerModule(name, fn, deps = []) {
  window.MCN_KERNEL.modules[name] = {
    fn,
    status: "idle",
    lastRun: 0,
    errors: 0,
    deps
  };

  window.MCN_KERNEL.graph.dependencies[name] = deps;
}

/* ================= HEALTH ENGINE ================= */

function updateHealth() {
  const s = window.MCN_SYSTEM;

  let health = 100;

  if (s.flags.emergency) health -= 40;
  if (s.stats.errorCount > 5) health -= s.stats.errorCount * 5;

  s.health = Math.max(0, health);
  s.flags.degraded = s.health < 60;

  return s.health;
}

/* ================= AI ENGINE ================= */

function evaluateAI() {
  const s = window.MCN_SYSTEM;

  let risk = 0;

  if (s.health < 60) risk += 40;
  if (s.stats.errorCount > 5) risk += 30;
  if (s.flags.emergency) risk += 50;

  window.MCN_AI.mode =
    risk > 70 ? "critical" :
    risk > 40 ? "warning" :
    "stable";

  window.MCN_AI.risk = risk;
}

/* ================= SAFE RUNNER ================= */

function runModule(name) {
  const mod = window.MCN_KERNEL.modules[name];
  if (!mod) return;

  try {
    mod.fn();
    mod.status = "active";
    mod.lastRun = Date.now();
  } catch (e) {
    mod.status = "failed";
    mod.errors++;

    window.MCN_SYSTEM.stats.errorCount++;

    window.MCN_KERNEL.status.lastFault = {
      module: name,
      error: e.message,
      time: Date.now()
    };
  }
}

/* ================= CYCLE ================= */

function kernelCycle() {
  Object.keys(window.MCN_KERNEL.modules).forEach(runModule);

  updateHealth();
  evaluateAI();
}

/* ================= LOOP ================= */

setInterval(kernelCycle, 3000);

console.log("🧠 MCN KERNEL v3.1 ONLINE");