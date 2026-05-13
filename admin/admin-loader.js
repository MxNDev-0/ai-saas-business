/* =========================================
   MCN ADMIN STEALTH LOADER
========================================= */

(async function () {

  try {

    console.log("🧠 Loading MCN Admin Core...");

    // Core boot
    await import("./admin-auth.js");

    // Emergency system
    await import("./emergency-control.js");

    // Diagnostics
    await import("./mobile-diagnostics.js");

    // Hidden monitor
    await import("./hidden-monitor.js");

    // Main admin engine
    await import("./admin.js");

    console.log("✅ MCN Admin Fully Loaded");

  } catch (err) {

    console.error(
      "Admin Loader Failed:",
      err
    );

    document.body.innerHTML = `
      <div style="
        background:#0b132b;
        color:white;
        height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        font-family:Arial;
        text-align:center;
        padding:20px;
      ">
        <div>
          <h1>⚠ Admin Boot Failed</h1>
          <p>${err.message}</p>
        </div>
      </div>
    `;
  }

})();