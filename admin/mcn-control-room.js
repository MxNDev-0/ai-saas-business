/* =========================================
   🧠 MCN CONTROL ROOM v2
   OS-STYLE DASHBOARD LAYOUT SYSTEM
========================================= */

export function startMCNControlRoom() {

  const root = document.getElementById("monitor");

  if (!root) {
    console.error("❌ MCN Control Room: #monitor missing");
    return;
  }

  if (window.__MCN_CONTROL_ROOM_ACTIVE) return;
  window.__MCN_CONTROL_ROOM_ACTIVE = true;

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

  /* ================= MODULE ACTIONS ================= */

  window.MCN_CONTROL = window.MCN_CONTROL || {};

  window.MCN_CONTROL.isolate = function (name) {
    const m = getModules()[name];
    if (!m) return;

    m.status = "isolated";
    console.warn("⚠ Module isolated:", name);
  };

  window.MCN_CONTROL.revive = function (name) {
    const m = getModules()[name];
    if (!m) return;

    m.status = "active";
    m.errors = 0;
    console.log("🟢 Module revived:", name);
  };

  window.MCN_CONTROL.inspect = function (name) {
    const m = getModules()[name];
    console.log("🔍 Module inspect:", name, m);
    alert(JSON.stringify(m, null, 2));
  };

  /* ================= RENDER SYSTEM ================= */

  function render() {

    const kernel = getKernel();
    const s = getSystem();
    const ai = getAI();
    const modules = getModules();

    const names = Object.keys(modules);

    const active = names.filter(n => modules[n].status === "active");
    const failed = names.filter(n => modules[n].status === "failed");
    const isolated = names.filter(n => modules[n].status === "isolated");

    root.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; font-family:monospace;">

        <!-- ================= LEFT PANEL ================= -->
        <div style="background:#0f172a; padding:10px; border-radius:8px; color:#fff; height:85vh; overflow:auto;">
          <h3>🧠 SYSTEM STATUS</h3>
          <hr>

          <div>Health: ${s.health ?? 100}</div>
          <div>Mode: ${ai.mode ?? "stable"}</div>
          <div>Risk: ${ai.risk ?? 0}</div>
          <div>Emergency: ${s.flags?.emergency ? "ON" : "OFF"}</div>

          <hr>

          <div>📌 Posts: ${s.stats?.posts ?? 0}</div>
          <div>💬 Support: ${s.stats?.supportChats ?? 0}</div>
          <div>⚠ Errors: ${s.stats?.errorCount ?? 0}</div>

          <hr>

          <div>🧩 Active: ${active.length}</div>
          <div style="color:orange;">Isolated: ${isolated.length}</div>
          <div style="color:red;">Failed: ${failed.length}</div>
        </div>

        <!-- ================= CENTER PANEL ================= -->
        <div style="background:#111827; padding:10px; border-radius:8px; color:#fff; height:85vh; overflow:auto;">
          <h3>🧩 MODULES</h3>
          <hr>

          ${
            names.map(n => {
              const m = modules[n];

              let color = "#22c55e";
              if (m.status === "failed") color = "#ef4444";
              if (m.status === "isolated") color = "#f59e0b";

              return `
                <div style="margin-bottom:10px; padding:6px; border:1px solid #333; border-radius:6px;">

                  <b style="color:${color}">${n}</b><br>
                  <small>Status: ${m.status}</small><br>
                  <small>Errors: ${m.errors ?? 0}</small>

                  <div style="margin-top:5px;">
                    <button onclick="MCN_CONTROL.isolate('${n}')">Isolate</button>
                    <button onclick="MCN_CONTROL.revive('${n}')">Revive</button>
                    <button onclick="MCN_CONTROL.inspect('${n}')">Inspect</button>
                  </div>

                </div>
              `;
            }).join("")
          }
        </div>

        <!-- ================= RIGHT PANEL ================= -->
        <div style="background:#0b1220; padding:10px; border-radius:8px; color:#fff; height:85vh; overflow:auto;">
          <h3>🤖 AI + ANALYTICS</h3>
          <hr>

          <div>Mode: ${ai.mode ?? "stable"}</div>
          <div>Risk Score: ${ai.risk ?? 0}</div>

          <hr>

          <h4>📡 LAST EVENT</h4>
          <div>${s.stats?.lastEvent ?? "none"}</div>

          <hr>

          <h4>🔥 SYSTEM HEALTH</h4>
          <div style="font-size:20px;">
            ${s.health ?? 100}%
          </div>

          <hr>

          <h4>⚙ KERNEL VERSION</h4>
          <div>${kernel.version ?? "unknown"}</div>
        </div>

      </div>
    `;
  }

  /* ================= LIVE LOOP ================= */

  setInterval(render, 1000);

  console.log("🧠 MCN CONTROL ROOM v2 ONLINE");
}