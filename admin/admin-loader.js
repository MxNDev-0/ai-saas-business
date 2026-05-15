/* =========================================
   MCN ADMIN LOADER V6 STABLE
========================================= */

(async function () {

  console.log("🧠 MCN Boot V6 starting...");

  const loaded = {};

  async function safeImport(path) {
    try {
      const mod = await import(path);
      loaded[path] = true;
      console.log("✅ Loaded:", path);
      return mod;
    } catch (e) {
      loaded[path] = false;
      console.error("❌ Failed:", path, e);
      return null;
    }
  }

  // IMPORTANT ORDER (AUTH FIRST)
  await safeImport("./firebase.js");

  const auth = await safeImport("./admin-auth.js");
  const control = await safeImport("./admin-control.js");

  await safeImport("./admin-monitor.js");

  // MAIN ENGINE
  const admin = await safeImport("./admin.js");

  await safeImport("./emergency-control.js");

  try {
    await safeImport("./admin-chat.js");
  } catch (e) {
    console.warn("Chat optional module missing");
  }

  /* =========================================
     GLOBAL SAFE ERROR HOOK
  ========================================= */

  window.addEventListener("error", (e) => {

    const box = document.getElementById("monitor");
    if (!box) return;

    const div = document.createElement("div");
    div.style.color = "red";
    div.textContent = "💥 " + e.message;

    box.appendChild(div);
  });

  /* =========================================
     READY SIGNAL
  ========================================= */

  setTimeout(() => {
    console.log("🚀 MCN ENGINE FULLY READY");
    window.dispatchEvent(new Event("mcn-ready"));
  }, 800);

})();