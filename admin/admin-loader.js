/* =========================================
   MCN ADMIN LOADER STABLE V5 (PATCHED)
========================================= */

(async function () {

  console.log("🧠 Booting MCN Admin...");

  const errors = [];

  async function safeImport(path) {

    try {

      await import(path);

      console.log("✅ Loaded:", path);

      return true;

    } catch (err) {

      console.error("❌ Failed loading:", path, err);

      errors.push({
        path,
        error: err.message
      });

      return false;
    }
  }

  /* ================= AUTH ================= */

  const authLoaded = await safeImport("./admin-auth.js");

  if (!authLoaded) {
    renderFatal("admin-auth.js failed to load");
    return;
  }

  /* ================= WAIT AUTH ================= */

  let tries = 0;

  while (!window.__MCN_ADMIN_AUTH && tries < 50) {
    await new Promise(r => setTimeout(r, 200));
    tries++;
  }

  if (!window.__MCN_ADMIN_AUTH) {
    renderFatal("Admin authentication failed");
    return;
  }

  /* ================= MAIN SYSTEMS ================= */
  await safeImport("./admin-auth.js");
  await safeImport("./admin-monitor.js"); // MUST BE FIRST UI LOG SYSTEM
  await safeImport("./admin.js");
  await safeImport("./emergency-control.js");

  /* ================= CHAT SYSTEM (NEW SAFE ADD) ================= */

  try {
    await safeImport("./admin-chat.js");
    console.log("💬 Chat system attached");
  } catch (e) {
    console.warn("Chat system optional module failed");
  }

  console.log("✅ MCN Admin Fully Loaded");

  /* ================= FATAL SCREEN ================= */

  function renderFatal(msg) {

    document.body.innerHTML = `
      <div style="
        background:#0b132b;
        color:white;
        min-height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        font-family:Arial;
        padding:20px;
      ">

        <div style="
          max-width:500px;
          width:100%;
          background:#1c2541;
          padding:25px;
          border-radius:16px;
        ">

          <h1 style="color:#ff6b6b;">⚠ Admin Boot Failed</h1>

          <p>${msg}</p>

          <div style="margin-top:20px;font-size:13px;color:#aaa;">
            ${
              errors.map(e => `
                <div style="margin-bottom:8px;">
                  <b>${e.path}</b><br>
                  ${e.error}
                </div>
              `).join("")
            }
          </div>

        </div>

      </div>
    `;
  }

})();