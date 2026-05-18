/* =========================================
   🧠 MCN CORE BRAIN (FINAL UNIFIED VERSION)
   Single Source of Truth + Autopilot + AI + Audit
========================================= */

/* ================= GLOBAL STATE ================= */

window.MCN_SYSTEM = window.MCN_SYSTEM || {
  health: 100,

  stats: {
    posts: 0,
    users: 0,
    supportChats: 0,
    lastEvent: null,
    errorCount: 0,
    brokenFunctions: 0,
    unusedFunctions: 0
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
  insights: [],
  lastDecision: null
};

window.MCN_CONTROLS = window.MCN_CONTROLS || {};

/* ================= EVENT BUS ================= */

window.MCN_BUS = window.MCN_BUS || {
  listeners: {},

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  },

  emit(event, data) {

    window.MCN_SYSTEM.stats.lastEvent = event;

    const list = this.listeners[event] || [];
    list.forEach(fn => fn(data));

    evaluateSystem();
    runAutopilot();
  }
};

/* ================= HEALTH ENGINE ================= */

function updateHealth() {

  const s = window.MCN_SYSTEM;

  let score = 100;

  if (s.flags.emergency) score -= 40;
  if (s.stats.supportChats > 100) score -= 20;
  if (s.stats.posts === 0) score -= 15;
  if (s.stats.errorCount > 0) score -= s.stats.errorCount * 5;

  if (score < 0) score = 0;

  s.health = score;
  s.flags.degraded = score < 60;

  return score;
}

/* ================= AI ENGINE ================= */

function evaluateAI() {

  const s = window.MCN_SYSTEM;
  const ai = window.MCN_AI;

  let risk = 0;
  let insights = [];

  if (s.stats.posts === 0) {
    risk += 25;
    insights.push("No content activity");
  }

  if (s.stats.supportChats > 100) {
    risk += 30;
    insights.push("High support load");
  }

  if (s.flags.emergency) {
    risk += 40;
    insights.push("Emergency state active");
  }

  if (s.health < 60) {
    risk += 20;
    insights.push("System degraded");
  }

  ai.risk = risk;
  ai.insights = insights;

  ai.mode =
    risk > 70 ? "critical" :
    risk > 40 ? "warning" :
    "stable";

  ai.lastDecision = {
    time: Date.now(),
    mode: ai.mode,
    risk
  };

  return ai;
}

/* ================= AUTOPILOT ================= */

function runAutopilot() {

  const s = window.MCN_SYSTEM;
  const ai = window.MCN_AI;

  if (!s.flags.autopilot) return;

  if (ai.mode === "critical") {
    s.flags.degraded = true;
    s.stats.errorCount += 1;
    return;
  }

  if (ai.mode === "warning") {
    if (s.stats.supportChats > 80) {
      s.stats.supportChats -= 1;
    }
    return;
  }

  if (ai.mode === "stable") {
    if (s.health < 100) {
      s.health += 0.3;
    }
  }
}

/* ================= SYSTEM EVALUATION ================= */

function evaluateSystem() {
  updateHealth();
  evaluateAI();
}

/* ================= FUNCTION AUDITOR ================= */

window.MCN_FUNCTIONS = window.MCN_FUNCTIONS || { registry: {} };

function auditSystem() {

  const reg = window.MCN_FUNCTIONS.registry;

  const broken = [];
  const unused = [];

  for (let k in reg) {
    if (reg[k].status === "failed") broken.push(k);
    if (reg[k].called === 0) unused.push(k);
  }

  window.MCN_SYSTEM.stats.brokenFunctions = broken.length;
  window.MCN_SYSTEM.stats.unusedFunctions = unused.length;

  return { broken, unused };
}

/* ================= LOOP ENGINE ================= */

setInterval(() => {
  evaluateSystem();
  runAutopilot();
  auditSystem();
}, 3000);

console.log("🧠 MCN CORE ONLINE (FINAL)");

/* =========================================
   🧠 MCN SELF-HEALING DEBUGGER (FULL MODULE)
   Runtime Fault Detection + Recovery + Watchdog
========================================= */

/* ================= GLOBAL DEBUG STATE ================= */

window.MCN_HEALTH = {
  errors: [],
  recoveries: [],
  lastFix: null,
  lastIssues: []
};

/* ================= ERROR CAPTURE SYSTEM ================= */

window.MCN_CAPTURE_ERROR = function (source, error) {

  const entry = {
    source: source || "unknown",
    message: error?.message || "unknown error",
    stack: error?.stack || null,
    time: Date.now()
  };

  window.MCN_HEALTH.errors.push(entry);

  if (window.MCN_SYSTEM) {
    window.MCN_SYSTEM.stats.errorCount =
      (window.MCN_SYSTEM.stats.errorCount || 0) + 1;
  }

  console.warn("🧠 MCN ERROR CAPTURED:", entry);

  triggerRecovery(entry);
};

/* ================= RECOVERY ENGINE ================= */

function triggerRecovery(error) {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  let action = "none";

  /* 🔴 SUPPORT OVERLOAD RECOVERY */
  if (error.source === "support" && s.stats.supportChats > 100) {
    s.stats.supportChats = Math.floor(s.stats.supportChats * 0.8);
    action = "throttled_support";
  }

  /* 🚨 EMERGENCY STABILIZATION */
  if (s.flags?.emergency) {
    s.flags.degraded = true;
    s.health = Math.min(100, (s.health || 100) + 5);
    action = "emergency_stabilize";
  }

  /* 🟡 HIGH ERROR RECOVERY */
  if (s.stats.errorCount > 10) {
    s.health = Math.min(100, (s.health || 100) + 3);
    action = "error_recovery_boost";
  }

  /* 🟢 DEFAULT SOFT RECOVERY */
  if (action === "none") {
    s.health = Math.min(100, (s.health || 100) + 2);
    action = "soft_recovery";
  }

  const fix = {
    error,
    action,
    time: Date.now()
  };

  window.MCN_HEALTH.recoveries.push(fix);
  window.MCN_HEALTH.lastFix = fix;

  console.warn("🧠 MCN RECOVERY EXECUTED:", action);
}

/* ================= FUNCTION WATCHDOG ================= */

function watchFunctions() {

  const reg = window.MCN_FUNCTIONS?.registry || {};

  for (let key in reg) {

    const fn = reg[key];

    if (fn.called === 0) {
      fn.status = "idle";
    }

    if (fn.status === "failed") {

      window.MCN_CAPTURE_ERROR("function:" + key, {
        message: "Function failure detected"
      });
    }
  }
}

/* ================= SYSTEM SELF DIAGNOSTIC ================= */

function runSelfCheck() {

  const s = window.MCN_SYSTEM;
  if (!s) return [];

  const issues = [];

  if (s.stats.errorCount > 5) issues.push("high_error_rate");
  if (s.stats.posts === 0) issues.push("no_content_flow");
  if (s.stats.supportChats > 100) issues.push("support_overload");
  if (s.health < 40) issues.push("low_health_system");

  window.MCN_HEALTH.lastIssues = issues;

  return issues;
}

/* ================= HEALTH AUTO-CORRECTION ================= */

function autoStabilizer() {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  /* slow recovery when stable */
  if (s.health < 100 && !s.flags?.emergency) {
    s.health = Math.min(100, s.health + 0.2);
  }

  /* prevent runaway errors */
  if (s.stats.errorCount > 20) {
    s.stats.errorCount = 20;
  }
}

/* ================= AUTO LOOP ENGINE ================= */

setInterval(() => {

  watchFunctions();
  runSelfCheck();
  autoStabilizer();

}, 4000);

console.log("🧠 MCN SELF-HEALING DEBUGGER ONLINE");