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