/* =========================================
   MCN ADMIN LOADER V2
========================================= */

(async function () {

  try {

    console.log("🧠 Booting MCN Admin V2...");

    await import("./admin.js");
    await import("./emergency-control.js");

    console.log("✅ Admin V2 Loaded Successfully");

  } catch (err) {

    console.error("BOOT ERROR:", err);

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