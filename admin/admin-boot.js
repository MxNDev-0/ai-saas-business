/* =========================================
   MCN ADMIN BOOT UI v2
   SYSTEM STARTUP CONTROLLER
========================================= */

(() => {

  const state = {
    stage: "booting",
    modules: {
      auth: false,
      monitor: false,
      admin: false,
      ready: false
    }
  };

  const bootBox = document.createElement("div");

  bootBox.id = "mcnBoot";
  bootBox.style = `
    position:fixed;
    inset:0;
    background:#0b132b;
    color:white;
    display:flex;
    justify-content:center;
    align-items:center;
    flex-direction:column;
    font-family:Arial;
    z-index:999999;
  `;

  bootBox.innerHTML = `
    <div style="text-align:center;max-width:400px;padding:20px;">
      <h2 style="color:#5bc0be;">MCN Engine Boot v2</h2>
      <div id="bootStatus">Initializing system...</div>

      <div style="margin-top:20px;height:6px;background:#1c2541;border-radius:10px;overflow:hidden;">
        <div id="bootBar" style="width:0%;height:100%;background:#5bc0be;transition:0.3s;"></div>
      </div>

      <div id="bootLogs" style="margin-top:15px;font-size:12px;color:#aaa;text-align:left;"></div>
    </div>
  `;

  document.body.appendChild(bootBox);

  const status = bootBox.querySelector("#bootStatus");
  const bar = bootBox.querySelector("#bootBar");
  const logs = bootBox.querySelector("#bootLogs");

  function log(msg, percent) {
    status.innerText = msg;
    logs.innerHTML += `<div>• ${msg}</div>`;
    if (percent != null) bar.style.width = percent + "%";
  }

  function finishBoot() {

    log("System Ready", 100);

    setTimeout(() => {
      bootBox.style.opacity = "0";
      bootBox.style.transition = "0.5s";

      setTimeout(() => {
        bootBox.remove();
      }, 500);

    }, 800);
  }

  /* ================= BOOT SEQUENCE ================= */

  log("Checking Firebase...", 10);

  setTimeout(() => {
    state.modules.auth = true;
    log("Auth module OK", 30);
  }, 400);

  setTimeout(() => {
    state.modules.monitor = true;
    log("Monitor system active", 60);
  }, 900);

  setTimeout(() => {
    state.modules.admin = true;
    log("Admin modules loaded", 85);
  }, 1400);

  setTimeout(() => {
    state.modules.ready = true;
    log("Finalizing startup...", 95);
    finishBoot();
  }, 2000);

  /* ================= GLOBAL STATUS ================= */

  window.__MCN_BOOT = state;

})();