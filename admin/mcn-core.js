/* =========================================
   🧠 MCN UNIFIED CORE (BRAIN SYSTEM)
   Single Source of Truth
========================================= */

window.MCN_SYSTEM = {
  health: 100,

  stats: {
    posts: 0,
    users: 0,
    supportChats: 0,
    lastEvent: null
  },

  flags: {
    emergency: false,
    degraded: false
  }
};

window.MCN_AI = {
  mode: "stable",
  risk: 0,
  insights: [],
  lastDecision: null
};

window.MCN_BUS = {
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
  }
};

/* =========================================
   HEALTH ENGINE
========================================= */

function updateHealth() {

  const s = window.MCN_SYSTEM;

  let score = 100;

  if (s.flags.emergency) score -= 40;
  if (s.stats.supportChats > 100) score -= 20;
  if (s.stats.posts === 0) score -= 15;

  if (score < 0) score = 0;

  s.health = score;

  s.flags.degraded = score < 60;

  return score;
}

/* =========================================
   AI ENGINE (MERGED PHASE 4)
========================================= */

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

/* =========================================
   MASTER EVALUATION LOOP
========================================= */

function evaluateSystem() {

  updateHealth();
  evaluateAI();
}

/* =========================================
   AUTO LOOP
========================================= */

setInterval(() => {
  evaluateSystem();
}, 3000);

console.log("🧠 MCN Unified Core Online");