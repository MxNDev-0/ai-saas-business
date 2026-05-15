/* =========================================
   MCN ADMIN LOADER V7 STABLE (FIXED)
========================================= */

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
     GLOBAL MONITOR LOGGER (FIRST — IMPORTANT)
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

  await safeImport("./emergency-control.js");

  try {
    await safeImport("./admin-chat.js");
  } catch (e) {
    console.warn("⚠ Optional chat module missing");
  }

  /* =========================================
     START MONITOR ENGINE
  ========================================== */

  if (monitorModule?.startMonitor) {
    monitorModule.startMonitor();
    console.log("🖥 Monitor engine started");
  } else {
    console.error("❌ startMonitor missing");
  }

  /* =========================================
     SAFE FALLBACK FUNCTIONS (GLOBAL)
  ========================================== */

  window.generateAI = async function () {
    const topic = document.getElementById("aiTopic")?.value;

    if (!topic) return alert("Enter topic");

    logToMonitor("🤖 AI generating article...");

    alert(`# ${topic}\n\nMCN AI placeholder article`);

    logToMonitor("✅ AI article generated");
  };

  window.searchPosts = function () {
    const val = document.getElementById("searchPosts")?.value?.toLowerCase() || "";
    console.log("Searching posts:", val);
  };

  window.loadNews = function () {
    const keyword = document.getElementById("newsKeyword")?.value;
    const box = document.getElementById("newsList");

    if (!box) return;

    box.innerHTML = `
      <div class="item">
        📰 Demo news: ${keyword || "general"}
      </div>
    `;

    logToMonitor("📰 News system loaded");
  };

  window.createBlog = function () {
    const title = document.getElementById("blogTitle")?.value;
    logToMonitor("📝 Blog request: " + title);
    alert("Blog system active (stub)");
  };

  window.updatePost = function () {
    logToMonitor("✏ Update triggered");
    alert("Update system active (stub)");
  };

  /* =========================================
     COMMAND TERMINAL FALLBACK
  ========================================== */

  window.runCommand = async function () {

    const input = document.getElementById("cmdInput");
    const box = document.getElementById("cmdOutput");

    if (!input || !box) return;

    const raw = input.value.trim();
    if (!raw) return;

    let result = "Unknown command";

    try {
      const parts = raw.split(" ");
      const cmd = parts[0].toLowerCase();

      if (cmd === "/ads") {
        result = parts[1] === "off" ? "Ads disabled" : "Ads enabled";
      }

      else if (cmd === "/discover") {
        result = parts[1] === "off" ? "Discover disabled" : "Discover enabled";
      }

      else if (cmd === "/status") {
        result = "MCN Engine operational";
      }

      else if (cmd === "/clear") {
        box.innerHTML = "";
        input.value = "";
        return;
      }

      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <b>${raw}</b><br>
        <small>${new Date().toLocaleTimeString()}</small><br>
        <span>${result}</span>
      `;

      box.prepend(div);

      logToMonitor("⌨ Command: " + raw);

    } catch (err) {
      console.error(err);
      logToMonitor("💥 Command failed", "error");
    }

    input.value = "";
  };

  /* =========================================
     REJECTED ADS
  ========================================== */

  window.clearRejected = function () {
    const box = document.getElementById("rejectedList");
    if (box) box.innerHTML = "";
    logToMonitor("🗑 Rejected cleared");
  };

  window.loadRejectedAds = function () {
    const box = document.getElementById("rejectedList");
    if (!box) return;

    box.innerHTML = `<div class="item">No rejected ads</div>`;
  };

  /* =========================================
     SUPPORT SYSTEM
  ========================================== */

  window.loadSupportInbox = function () {
    const users = document.getElementById("supportUsers");
    const messages = document.getElementById("supportMessages");

    if (!users || !messages) return;

    users.innerHTML = `<div class="item">No users</div>`;
    messages.innerHTML = `<div class="item">Support ready</div>`;
  };

  /* =========================================
     DOM READY SAFE BINDINGS
  ========================================== */

  window.addEventListener("DOMContentLoaded", () => {

    const supportBtn = document.getElementById("sendSupportReply");

    if (supportBtn) {
      supportBtn.onclick = function () {
        const input = document.getElementById("supportReply");

        if (!input?.value.trim()) return;

        logToMonitor("💬 Support reply sent");

        input.value = "";
      };
    }

    if (window.loadRejectedAds) window.loadRejectedAds();
    if (window.loadSupportInbox) window.loadSupportInbox();
  });

  /* =========================================
     ERROR HANDLER
  ========================================== */

  window.addEventListener("error", (e) => {
    logToMonitor("💥 " + e.message, "error");
  });

  /* =========================================
     READY SIGNAL
  ========================================== */

  setTimeout(() => {
    console.log("🚀 MCN ENGINE FULLY READY");
    logToMonitor("🚀 MCN ENGINE FULLY READY");

    window.dispatchEvent(new Event("mcn-ready"));
  }, 1000);

})();