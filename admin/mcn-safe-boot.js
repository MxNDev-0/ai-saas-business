/* =========================================
   🧠 MCN SAFE BOOT MODE (CRASH PROOF)
   Forces monitor to render even if system fails
========================================= */

function safeInit() {

  window.MCN_SYSTEM = window.MCN_SYSTEM || {
    health: 100,
    stats: { posts: 0, supportChats: 0, errorCount: 0, lastEvent: "boot_safe" },
    flags: { emergency: false }
  };

  window.MCN_AI = window.MCN_AI || {
    mode: "stable",
    risk: 0
  };

  const box = document.getElementById("monitor");

  if (!box) {
    console.error("❌ Monitor missing in DOM");
    return;
  }

  function render() {

    const s = window.MCN_SYSTEM;
    const ai = window.MCN_AI;

    box.innerHTML = `
      <div><b>🧠 MCN SAFE MODE ACTIVE</b></div>
      <hr>
      <div>System Recovery Mode Running...</div>
      <div>Health: ${s.health}</div>
      <div>Posts: ${s.stats.posts}</div>
      <div>Support: ${s.stats.supportChats}</div>
      <div>Last Event: ${s.stats.lastEvent}</div>
      <hr>
      <div>AI Mode: ${ai.mode}</div>
      <div>Risk: ${ai.risk}</div>
    `;
  }

  setInterval(render, 1000);

  console.log("🧠 SAFE BOOT ONLINE");
}

safeInit();