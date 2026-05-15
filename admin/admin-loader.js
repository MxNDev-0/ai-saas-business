/* =========================================
   MCN ADMIN LOADER V19
========================================= */

(async function () {

  console.log("🧠 Booting MCN Admin V19...");

  const errors = [];

  async function safeImport(path) {
    try {
      await import(path);
      console.log("✅ Loaded:", path);
      return true;
    } catch (err) {
      console.error("❌ Failed:", path, err);
      errors.push({ path, error: err.message });
      return false;
    }
  }

  // BOOT FIRST (IMPORTANT)
  const boot = await safeImport("./admin-boot.js");

  if (boot && window.bootMCN) {
    window.bootMCN();
  }

  // CORE SYSTEMS
  const auth = await safeImport("./admin-auth.js");
  const monitor = await safeImport("./admin-monitor.js");
  const admin = await safeImport("./admin.js");
  const emergency = await safeImport("./emergency-control.js");

  try {
    await safeImport("./admin-chat.js");
  } catch (e) {}

  // GLOBAL ERROR HOOK
  window.addEventListener("error", (e) => {

    const box = document.getElementById("monitor");
    if (!box) return;

    const div = document.createElement("div");
    div.style.color = "red";
    div.textContent = "💥 " + e.message;

    box.appendChild(div);
  });

  // FINAL STATUS
  console.log("✅ MCN ENGINE V19 READY");

})();