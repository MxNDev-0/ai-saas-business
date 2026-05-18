export function startMCNControlRoom() {
  const root = document.getElementById("monitor");
  if (!root) return;

  if (window.__MCN_CONTROL_ROOM_ACTIVE) return;
  window.__MCN_CONTROL_ROOM_ACTIVE = true;

  window.MCN_CONTROL = window.MCN_CONTROL || {};

  window.MCN_CONTROL.isolate = (name) => {
    const m = window.MCN_KERNEL?.modules?.name;
    if (!m) return;
    m.status = "isolated";
  };

  window.MCN_CONTROL.revive = (name) => {
    const m = window.MCN_KERNEL?.modules?.name;
    if (!m) return;
    m.status = "active";
    m.errors = 0;
  };

  function render() {
    const kernel = window.MCN_KERNEL || {};
    const modules = kernel.modules || {};
    const names = Object.keys(modules);

    root.innerHTML = `
      <div><b>🧠 CONTROL ROOM</b></div>
      <hr>

      ${names.map(n => `
        <div>
          ${n} - ${modules[n].status}
        </div>
      `).join("")}
    `;
  }

  setInterval(render, 1000);

  console.log("🧠 CONTROL ROOM ONLINE");
}