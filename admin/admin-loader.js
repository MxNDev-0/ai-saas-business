/* =========================================
   MCN ADMIN LOADER V3
========================================= */

(async function () {

  try {

    console.log("🧠 Booting MCN Admin V3...");

    await import("./admin-auth.js");

    if (!window.__MCN_ADMIN_AUTH) {
      throw new Error("Admin authentication failed");
    }

    await import("./admin.js");
    await import("./emergency-control.js");

    console.log("✅ MCN Admin Fully Loaded");

  } catch (err) {

    console.error("ADMIN BOOT ERROR:", err);

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

          <p style="margin-top:10px;">
            ${err.message}
          </p>

          <p style="
            margin-top:15px;
            color:#5bc0be;
            font-size:13px;
          ">
            Check console for full details
          </p>
        </div>
      </div>
    `;
  }

})();