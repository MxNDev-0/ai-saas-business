import { emit } from "./mcn-event-bus.js";

window.MCN_HEAL = window.MCN_HEAL || {
  restarts: 0,
  lastFix: null
};

function watchdog() {

  const s = window.MCN_SYSTEM;
  if (!s) return;

  const frozen =
    s.stats.posts === 0 &&
    s.stats.supportChats === 0 &&
    !s.stats.lastEvent;

  if (frozen) {
    attemptRecovery("frozen_state");
  }

  if (s.health < 40) {
    attemptRecovery("low_health");
  }
}

function attemptRecovery(reason) {

  const s = window.MCN_SYSTEM;
  window.MCN_HEAL.restarts++;

  if (reason === "frozen_state") {
    s.health += 10;
    emit("heal:recovery", reason);
  }

  if (reason === "low_health") {
    s.health += 5;
    s.stats.errorCount++;
    emit("heal:boost", reason);
  }

  window.MCN_HEAL.lastFix = { reason, time: Date.now() };
}

function startSelfHealing() {

  setInterval(() => {
    watchdog();
  }, 3000);

  console.log("🧠 MCN SELF-HEAL CONNECTED");
}

export function startMCNHealing() {
  startSelfHealing();
}