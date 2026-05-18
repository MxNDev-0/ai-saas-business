/* =========================================
   🧠 MCN SINGLE-CLOCK AUTONOMOUS BRAIN
   Unified System + AI + Healing + Prediction
========================================= */

/* ================= GLOBAL STATE ================= */

window.MCN_SYSTEM = window.MCN_SYSTEM || {
  health: 100,

  stats: {
    posts: 0,
    users: 0,
    supportChats: 0,
    lastEvent: null,
    errorCount: 0
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

window.MCN_FUNCTIONS = window.MCN_FUNCTIONS || { registry: {} };

window.MCN_PREDICTION = window.MCN_PREDICTION || {
  riskScore: 0,
  zones: {},
  forecast: []
};

window.MCN_HEALTH_LOG = [];

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
  }
};

/* ================= CORE ENGINE ================= */

function evaluateSystem() {

  const s = window.MCN_SYSTEM;
  const ai = window.MCN_AI;

  /* ================= HEALTH ================= */

  let health = 100;

  if (s.flags.emergency) health -= 40;
  if (s.stats.supportChats > 100) health -= 20;
  if (s.stats.posts === 0) health -= 15;
  if (s.stats.errorCount > 0) health -= s.stats.errorCount * 5;

  s.health = Math.max(0, health);
  s.flags.degraded = s.health < 60;

  /* ================= AI ================= */

  let risk = 0;
  let insights = [];

  if (s.stats.posts === 0) {
    risk += 25;
    insights.push("No content activity");
  }

  if (s.stats.supportChats > 100) {
    risk += 30;
    insights.push("Support overload");
  }

  if (s.flags.emergency) {
    risk += 40;
    insights.push("Emergency active");
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

  /* ================= FUNCTION AUDIT ================= */

  const reg = window.MCN_FUNCTIONS.registry;
  let broken = 0;
  let unused = 0;

  for (let k in reg) {
    if (reg[k].status === "failed") broken++;
    if (reg[k].called === 0) unused++;
  }

  s.stats.errorCount = Math.min(50, s.stats.errorCount);
  s.stats.brokenFunctions = broken;
  s.stats.unusedFunctions = unused;

  /* ================= PREDICTION ENGINE ================= */

  const zones = {
    system: s.health < 60 ? 40 : 10,
    support: s.stats.supportChats > 100 ? 40 : 10,
    content: s.stats.posts === 0 ? 30 : 10,
    functions: broken > 3 ? 40 : 10
  };

  const riskScore =
    zones.system +
    zones.support +
    zones.content +
    zones.functions;

  window.MCN_PREDICTION.riskScore = riskScore;
  window.MCN_PREDICTION.zones = zones;

  window.MCN_PREDICTION.forecast = [];

  if (riskScore > 120) {
    window.MCN_PREDICTION.forecast.push("⚠ High system instability risk");
  }

  if (broken > 3) {
    window.MCN_PREDICTION.forecast.push("⚠ Function failure cluster forming");
  }

  if (s.stats.supportChats > 100) {
    window.MCN_PREDICTION.forecast.push("⚠ Support overload forming");
  }

  if (window.MCN_PREDICTION.forecast.length === 0) {
    window.MCN_PREDICTION.forecast.push("🟢 System stable");
  }

  /* ================= LOG HISTORY ================= */

  window.MCN_HEALTH_LOG.push({
    time: Date.now(),
    health: s.health,
    risk: ai.risk,
    prediction: riskScore
  });

  if (window.MCN_HEALTH_LOG.length > 50) {
    window.MCN_HEALTH_LOG.shift();
  }
}

/* ================= AUTOPILOT ================= */

function runAutopilot() {

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

/* ================= SELF HEALING ================= */

function selfHealing() {

  const s = window.MCN_SYSTEM;

  if (s.stats.errorCount > 20) {
    s.stats.errorCount = 20;
  }

  if (!s.flags.emergency && s.health < 100) {
    s.health += 0.1;
  }
}

/* ================= SINGLE CLOCK ENGINE ================= */

function MCN_CLOCK() {

  evaluateSystem();
  runAutopilot();
  selfHealing();
}

/* ================= START SINGLE CLOCK ================= */

setInterval(MCN_CLOCK, 3000);

console.log("🧠 MCN SINGLE-CLOCK AUTONOMOUS BRAIN ONLINE");