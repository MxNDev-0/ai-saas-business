/* =========================================
   🧠 MCN AUTONOMOUS CORE (SAFE AUTOPILOT)
   Phase 5 — Controlled Self-Management
========================================= */

/* ================= SYSTEM STATE ================= */

window.MCN_SYSTEM = {
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

window.MCN_AI = {
  mode: "stable",
  risk: 0,
  insights: [],
  lastDecision: null
};

/* ================= EVENT BUS ================= */

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
    runAutopilot(); // 🔥 AUTONOMY TRIGGER
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

/* ================= AUTONOMOUS ENGINE ================= */

function runAutopilot() {

  const s = window.MCN_SYSTEM;
  const ai = window.MCN_AI;

  if (!s.flags.autopilot) return;

  /* =========================================
     ⚠ CRITICAL MODE ACTIONS
  ========================================= */

  if (ai.mode === "critical") {

    console.warn("🚨 AUTOPILOT: Critical state detected");

    // soft emergency activation
    s.flags.degraded = true;

    // reduce system stress indicator
    s.stats.errorCount += 1;

    return;
  }

  /* =========================================
     ⚠ WARNING MODE ACTIONS
  ========================================= */

  if (ai.mode === "warning") {

    console.warn("⚠ AUTOPILOT: Warning state");

    // stabilize system gradually
    if (s.stats.supportChats > 80) {
      s.stats.supportChats -= 1; // simulate throttling
    }

    return;
  }

  /* =========================================
     🟢 STABLE MODE ACTIONS
  ========================================= */

  if (ai.mode === "stable") {

    // passive optimization
    if (s.health < 100) {
      s.health += 0.5; // slow recovery
    }
  }
}

/* ================= SYSTEM EVALUATION ================= */

function evaluateSystem() {
  updateHealth();
  evaluateAI();
}

/* ================= AUTO LOOP ================= */

setInterval(() => {
  evaluateSystem();
  runAutopilot();
}, 3000);

console.log("🧠 MCN Autonomous Core ONLINE");