export function startMCNConsole() {
  const root = document.getElementById("monitor");
  if (!root) return;

  if (window.__MCN_CONSOLE_ACTIVE) return;
  window.__MCN_CONSOLE_ACTIVE = true;

  function render() {
    const s = window.MCN_SYSTEM || {};
    const ai = window.MCN_AI || {};
    const kernel = window.MCN_KERNEL || {};

    const modules = kernel.modules || {};
    const names = Object.keys(modules);

    const failed = names.filter(n => modules[n].status === "failed");

    root.innerHTML = `
      <div><b>🧠 MCN CONTROL CONSOLE</b></div>
      <hr>

      <div>Health: ${s.health ?? 100}</div>
      <div>Mode: ${ai.mode ?? "stable"}</div>
      <div>Risk: ${ai.risk ?? 0}</div>

      <hr>

      <div><b>📦 MODULES</b></div>
      <div>Active: ${names.length - failed.length}</div>
      <div style="color:red;">Failed: ${failed.length}</div>

      <hr>

      <div><b>📡 LAST EVENT</b></div>
      <div>${s.stats?.lastEvent ?? "none"}</div>
    `;
  }

  setInterval(render, 1000);

  console.log("🧠 MCN CONSOLE ONLINE");
}