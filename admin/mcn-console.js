/* =========================================
   🧠 MCN VISUAL CONTROL CONSOLE v1
   Live Kernel Map + Health + Dependency View
========================================= */

export function startMCNConsole() {

  const root = document.getElementById("monitor");

  if (!root) {
    console.error("❌ MCN Console: monitor container missing");
    return;
  }

  if (window.__MCN_CONSOLE_ACTIVE) return;
  window.__MCN_CONSOLE_ACTIVE = true;

  function getKernel() {
    return window.MCN_KERNEL || {};
  }

  function getSystem() {
    return window.MCN_SYSTEM || {};
  }

  function getAI() {
    return window.MCN_AI || {};
  }

  function getModules() {
    return getKernel().modules || {};
  }

  /* ================= RENDER LOOP ================= */

  function render() {

    const kernel = getKernel();
    const s = getSystem();
    const ai = getAI();
    const modules = getModules();

    const moduleNames = Object.keys(modules);

    const active = moduleNames.filter(m => modules[m].status === "active");
    const failed = moduleNames.filter(m => modules[m].status === "failed");
    const isolated = moduleNames.filter(m => modules[m].status === "isolated");

    root.innerHTML = `
      <div style="font-size:16px"><b>🧠 MCN VISUAL CONTROL CONSOLE v1</b></div>
      <hr>

      <div><b>⚡ SYSTEM OVERVIEW</b></div>
      <div>Health: ${s.health ?? 100}</div>
      <div>Mode: ${ai.mode ?? "stable"}</div>
      <div>Risk: ${ai.risk ?? 0}</div>
      <div>Emergency: ${s.flags?.emergency ? "ON" : "OFF"}</div>

      <hr>

      <div><b>📦 MODULE STATUS</b></div>
      <div>Active: ${active.length}</div>
      <div style="color:orange;">Isolated: ${isolated.length}</div>
      <div style="color:red;">Failed: ${failed.length}</div>

      <hr>

      <div><b>🧩 MODULE LIST</b></div>
      <div style="max-height:120px; overflow:auto; font-size:12px;">
        ${
          moduleNames.map(name => {

            const m = modules[name];

            let color = "#00ff88";

            if (m.status === "failed") color = "red";
            if (m.status === "isolated") color = "orange";
            if (m.status === "degraded") color = "yellow";

            return `
              <div style="margin-bottom:4px; color:${color}">
                ▸ ${name} (${m.status})
              </div>
            `;
          }).join("")
        }
      </div>

      <hr>

      <div><b>📡 SYSTEM ACTIVITY</b></div>
      <div>Posts: ${s.stats?.posts ?? 0}</div>
      <div>Support: ${s.stats?.supportChats ?? 0}</div>
      <div>Error Count: ${s.stats?.errorCount ?? 0}</div>
      <div>Last Event: ${s.stats?.lastEvent ?? "none"}</div>

      <hr>

      <div><b>🧠 AI DECISION LAYER</b></div>
      <div>Status: ${ai.mode ?? "stable"}</div>
      <div>Risk Score: ${ai.risk ?? 0}</div>

      <hr>

      <div><b>🔴 FAULT SIGNALS</b></div>
      <div>
        ${
          failed.length > 0
            ? "⚠ System instability detected"
            : "🟢 No active failures"
        }
      </div>

      <hr>

      <div style="font-size:11px; opacity:0.7;">
        MCN Kernel v${kernel.version || "unknown"} | Console Live
      </div>
    `;
  }

  /* ================= LIVE LOOP ================= */

  setInterval(render, 1000);

  console.log("🧠 MCN VISUAL CONTROL CONSOLE v1 ONLINE");
}