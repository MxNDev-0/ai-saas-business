/* =========================================
   🧠 MCN KERNEL v3 — DEPENDENCY GRAPH SYSTEM
   True Modular Kernel + Dependency Resolver + Fault Containment
========================================= */

/* ================= KERNEL STATE ================= */

window.MCN_KERNEL = {
  version: "v3",

  modules: {},

  graph: {
    dependencies: {},   // module -> [deps]
    dependents: {}      // module -> [dependents]
  },

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

/* ================= MODULE REGISTRATION ================= */

function registerModule(name, fn, deps = []) {

  window.MCN_KERNEL.modules[name] = {
    fn,
    status: "idle",
    lastRun: 0,
    errors: 0,
    deps
  };

  window.MCN_KERNEL.graph.dependencies[name] = deps;

  deps.forEach(dep => {
    if (!window.MCN_KERNEL.graph.dependents[dep]) {
      window.MCN_KERNEL.graph.dependents[dep] = [];
    }
    window.MCN_KERNEL.graph.dependents[dep].push(name);
  });
}

/* ================= TOPOLOGICAL SORT ================= */

function resolveExecutionOrder() {

  const graph = window.MCN_KERNEL.graph.dependencies;
  const visited = {};
  const stack = [];
  const temp = {};

  function visit(node) {

    if (temp[node]) {
      console.warn("⚠ Circular dependency detected:", node);
      return;
    }

    if (visited[node]) return;

    temp[node] = true;

    (graph[node] || []).forEach(dep => visit(dep));

    visited[node] = true;
    temp[node] = false;

    stack.push(node);
  }

  Object.keys(graph).forEach(visit);

  return stack;
}

/* ================= SAFE MODULE RUNNER ================= */

function runModule(name) {

  const mod = window.MCN_KERNEL.modules[name];

  if (!mod) return;

  try {
    mod.fn();
    mod.status = "active";
    mod.lastRun = Date.now();

  } catch (err) {

    mod.status = "failed";
    mod.errors++;

    window.MCN_SYSTEM.stats.errorCount++;

    window.MCN_KERNEL.status.lastFault = {
      module: name,
      message: err.message,
      time: Date.now()
    };

    console.warn("🧠 MODULE FAILURE:", name, err.message);

    isolateModule(name);
  }
}

/* ================= MODULE ISOLATION ================= */

function isolateModule(name) {

  const dependents = window.MCN_KERNEL.graph.dependents[name] || [];

  window.MCN_KERNEL.modules[name].status = "isolated";

  // isolate dependent modules too (cascade protection)
  dependents.forEach(dep => {
    if (window.MCN_KERNEL.modules[dep]) {
      window.MCN_KERNEL.modules[dep].status = "degraded";
    }
  });

  console.warn("⚠ ISOLATION CASCADE:", name, dependents);
}

/* ================= SYSTEM HEALTH ================= */

function evaluateHealth() {

  const s = window.MCN_SYSTEM;

  let health = 100;

  if (s.flags.emergency) health -= 40;
  if (s.stats.errorCount > 5) health -= s.stats.errorCount * 5;

  s.health = Math.max(0, health);
  s.flags.degraded = s.health < 60;
}

/* ================= SIMPLE AI LAYER ================= */

function evaluateAI() {

  const s = window.MCN_SYSTEM;

  let risk = 0;

  if (s.health < 60) risk += 40;
  if (s.stats.errorCount > 5) risk += 30;
  if (s.flags.emergency) risk += 50;

  window.MCN_AI = {
    mode:
      risk > 70 ? "critical" :
      risk > 40 ? "warning" :
      "stable",

    risk
  };
}

/* ================= KERNEL EXECUTION CYCLE ================= */

function kernelCycle() {

  const order = resolveExecutionOrder();

  // run dependencies first
  order.forEach(runModule);

  // system evaluation
  evaluateHealth();
  evaluateAI();
}

/* ================= AUTOPILOT ================= */

function autopilot() {

  const s = window.MCN_SYSTEM;
  const ai = window.MCN_AI;

  if (!s.flags.autopilot) return;

  if (ai.mode === "critical") {
    s.flags.degraded = true;
    s.stats.errorCount += 1;
  }

  if (ai.mode === "warning") {
    if (s.stats.supportChats > 80) {
      s.stats.supportChats -= 1;
    }
  }

  if (ai.mode === "stable" && s.health < 100) {
    s.health += 0.2;
  }
}

/* ================= MAIN CLOCK ================= */

setInterval(() => {
  kernelCycle();
  autopilot();
}, 3000);

console.log("🧠 MCN KERNEL v3 DEPENDENCY GRAPH ONLINE");