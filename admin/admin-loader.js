(async function () {

  console.log("🧠 MCN Boot V7 starting...");

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

  /* =========================================
     GLOBAL MONITOR LOGGER
  ========================================= */

  window.logToMonitor = function (msg, type = "ok") {
    const box = document.getElementById("monitor");
    if (!box) return;

    const div = document.createElement("div");

    div.style.color =
      type === "error" ? "red" : "#00ff88";

    div.textContent =
      `[${new Date().toLocaleTimeString()}] ${msg}`;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  };

  /* =========================================
     CORE MODULES
  ========================================= */

  await safeImport("./firebase.js");

  const authModule = await safeImport("./admin-auth.js");
  const controlModule = await safeImport("./admin-control.js");
  const monitorModule = await safeImport("./admin-monitor.js");
  const adminModule = await safeImport("./admin.js");

  /* 🔥 AI ENGINE (NEW INJECTION) */
  const aiModule = await safeImport("./ai-engine.js");

  await safeImport("./emergency-control.js");

  try {
    await safeImport("./admin-chat.js");
  } catch (e) {
    console.warn("⚠ Optional chat module missing");
  }

  /* =========================================
     START MONITOR ENGINE
  ========================================= */

  if (monitorModule?.startMonitor) {
    monitorModule.startMonitor();
    console.log("🖥 Monitor engine started");
  }

  /* =========================================
     GLOBAL AI HOOK (NEW)
  ========================================= */

  window.MCN_AI = aiModule || {};

  window.generateAIArticleGlobal = async function (topic) {

    if (window.MCN_AI?.generateAIArticle) {
      return await window.MCN_AI.generateAIArticle(topic);
    }

    // fallback if AI engine not loaded
    return `
# ${topic}

MCN fallback AI engine active.

AI module not loaded properly.
    `.trim();
  };

  /* =========================================
     SAFE FALLBACK FUNCTIONS
  ========================================= */

  window.generateAI = async function () {
    const topic = document.getElementById("aiTopic")?.value;

    if (!topic) return alert("Enter topic");

    logToMonitor("🤖 AI generating article...");

    const article = await window.generateAIArticleGlobal(topic);

    alert(article);

    logToMonitor("✅ AI article generated");
  };

  window.createBlog = async function () {

    const title = document.getElementById("blogTitle")?.value;

    if (!title) return logToMonitor("Missing title", "error");

    const content = document.getElementById("blogContent")?.value;

    let finalContent = content;

    if (!finalContent || finalContent.trim() === "") {
      finalContent = await window.generateAIArticleGlobal(title);
    }

    logToMonitor("📝 Blog ready for creation");

    if (window.adminModule?.createBlog) {
      window.adminModule.createBlog(title, finalContent);
    }
  };

  /* =========================================
     STATUS CHECKER (DEBUG TOOL)
  ========================================= */

  console.log("📦 LOAD REPORT:", loaded);

  /* =========================================
     READY SIGNAL
  ========================================= */

  setTimeout(() => {
    console.log("🚀 MCN ENGINE FULLY READY");
    logToMonitor("🚀 MCN ENGINE FULLY READY");

    window.dispatchEvent(new Event("mcn-ready"));
  }, 1000);

})();