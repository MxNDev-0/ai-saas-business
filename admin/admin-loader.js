(async function () {

  console.log("🧠 MCN Boot V19 starting...");

  async function safeImport(path) {
    try {
      await import(path);
      console.log("✅ Loaded:", path);
      return true;
    } catch (e) {
      console.error("❌ Failed:", path);
      return false;
    }
  }

  await safeImport("./admin-boot.js");
  await safeImport("./admin-auth.js");
  await safeImport("./admin-monitor.js");
  await safeImport("./admin.js");
  await safeImport("./emergency-control.js");

  try {
    await safeImport("./admin-chat.js");
  } catch {}

  window.addEventListener("error", (e) => {

    const box = document.getElementById("monitor");
    if (!box) return;

    const div = document.createElement("div");
    div.style.color = "red";
    div.textContent = "💥 " + e.message;

    box.appendChild(div);
  });

  console.log("✅ MCN ENGINE READY");

})();