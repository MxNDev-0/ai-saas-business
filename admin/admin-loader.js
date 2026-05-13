(async function () {

  try {

    console.log("🧠 Loading MCN Admin Core...");

    await import("./admin-auth.js");
    await import("./emergency-control.js");
    await import("./admin.js");

    console.log("✅ MCN Admin Fully Loaded");

  } catch (err) {

    console.error("Admin Boot Failed:", err);

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