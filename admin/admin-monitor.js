export function startMonitor() {

  const box = document.getElementById("monitor");

  if (!box) {
    console.error("❌ Monitor missing");
    return;
  }

  if (window.__MCN_MONITOR_ACTIVE) return;
  window.__MCN_MONITOR_ACTIVE = true;

  function render() {

    const s = window.MCN_SYSTEM || {};
    const ai = window.MCN_AI || {};
    const fn = window.MCN_FUNCTIONS?.registry || {};

    const broken = Object.keys(fn).filter(k => fn[k].status === "failed");
    const unused = Object.keys(fn).filter(k => fn[k].called === 0);

    box.innerHTML = `
      <div><b>🧠 MCN CONTROL FACE</b></div>
      <hr>

      <div>📝 Posts: ${s.stats?.posts ?? 0}</div>
      <div>💬 Support: ${s.stats?.supportChats ?? 0}</div>
      <div>⚡ Health: ${s.health ?? 100}</div>
      <div>🚨 Emergency: ${s.flags?.emergency ? "ON" : "OFF"}</div>

      <hr>

      <div><b>🤖 AI STATUS</b></div>
      <div>Mode: ${ai.mode ?? "stable"}</div>
      <div>Risk: ${ai.risk ?? 0}</div>

      <hr>

      <div><b>⚙ FUNCTION AUDIT</b></div>
      <div>❌ Broken: ${broken.length}</div>
      <div>⚠ Unused: ${unused.length}</div>

      <hr>

      <div><b>📡 LAST EVENT</b></div>
      <div>${s.stats?.lastEvent ?? "none"}</div>
    `;
  }

  setInterval(render, 1000);

  console.log("🖥 MCN MONITOR ONLINE");
}