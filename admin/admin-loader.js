/* =========================================
   MCN ADMIN LOADER STABLE V6
   FULL COPY PASTE (FIXED + INJECTED)
========================================= */

(async function () {

  console.log("🧠 Booting MCN Admin...");

  const errors = [];

  /* =========================================
     SAFE IMPORT
  ========================================= */

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

  /* =========================================
     AUTH SYSTEM
  ========================================= */

  const authLoaded =
    await safeImport("./admin-auth.js");

  if (!authLoaded) {
    renderFatal("admin-auth.js failed to load");
    return;
  }

  /* =========================================
     WAIT FOR AUTH READY
  ========================================= */

  let tries = 0;

  while (
    !window.__MCN_ADMIN_AUTH &&
    tries < 50
  ) {
    await new Promise(r => setTimeout(r, 200));
    tries++;
  }

  if (!window.__MCN_ADMIN_AUTH) {
    renderFatal("Admin authentication failed");
    return;
  }

  /* =========================================
     LOAD CORE SYSTEMS
  ========================================= */

  const monitorLoaded =
    await safeImport("./admin-monitor.js");

  const adminLoaded =
    await safeImport("./admin.js");

  const emergencyLoaded =
    await safeImport("./emergency-control.js");

  /* =========================================
     OPTIONAL CHAT SYSTEM
  ========================================= */

  try {
    await safeImport("./admin-chat.js");
    console.log("💬 Chat system attached");
  } catch (e) {
    console.warn("⚠ Chat system optional module failed");
  }

  /* =========================================
     LOADER RESULTS
  ========================================= */

  if (monitorLoaded && adminLoaded && emergencyLoaded) {
    console.log("✅ MCN Admin Fully Loaded");
  } else {
    console.warn("⚠ Some systems failed to load");
  }

  /* =========================================
     GLOBAL CRASH DETECTION
  ========================================= */

  window.addEventListener("error", (e) => {

    console.error("💥 Global Crash:", e.error);

    const box = document.getElementById("monitor");

    if (box) {

      const div = document.createElement("div");
      div.style.color = "red";
      div.style.marginBottom = "5px";
      div.textContent = `💥 ${e.message}`;

      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
  });

  /* =========================================
     FUNCTION CHECK (INJECTED FIX)
  ========================================= */

  window.addEventListener("load", () => {

    setTimeout(() => {

      console.log("🔎 Checking Admin Functions...");

      if (!window.createBlog) console.warn("⚠ createBlog missing");
      if (!window.loadNews) console.warn("⚠ loadNews missing");
      if (!window.generateAI) console.warn("⚠ generateAI missing");
      if (!window.clearRejected) console.warn("⚠ clearRejected missing");

      console.log("✅ Function check complete");

    }, 1000);

  });

  /* =========================================
     FATAL SCREEN
  ========================================= */

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
          box-shadow:0 0 25px rgba(0,0,0,0.4);
        ">

          <h1 style="color:#ff6b6b;margin-top:0;">
            ⚠ Admin Boot Failed
          </h1>

          <p style="line-height:1.6;color:#ddd;">
            ${msg}
          </p>

          <div style="
            margin-top:20px;
            font-size:13px;
            color:#aaa;
            max-height:300px;
            overflow:auto;
            padding-right:10px;
          ">

            ${
              errors.map(e => `
                <div style="
                  margin-bottom:12px;
                  padding:10px;
                  background:#111827;
                  border-radius:10px;
                ">
                  <b style="color:#5bc0be;">
                    ${e.path}
                  </b>
                  <br><br>
                  <span>${e.error}</span>
                </div>
              `).join("")
            }

          </div>

        </div>

      </div>
    `;
  }

})();