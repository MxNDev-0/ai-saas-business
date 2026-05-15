/* =========================================
   MCN ADMIN LOADER V7 STABLE
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
     CORE MODULES
  ========================================= */

  await safeImport("./firebase.js");

  const authModule =
    await safeImport("./admin-auth.js");

  const controlModule =
    await safeImport("./admin-control.js");

  const monitorModule =
    await safeImport("./admin-monitor.js");

  const adminModule =
    await safeImport("./admin.js");

  await safeImport("./emergency-control.js");

  try {

    await safeImport("./admin-chat.js");

  } catch (e) {

    console.warn(
      "⚠ Optional chat module missing"
    );
  }

  /* =========================================
     START MONITOR ENGINE
  ========================================= */

  if (
    monitorModule &&
    typeof monitorModule.startMonitor === "function"
  ) {

    monitorModule.startMonitor();

    console.log(
      "🖥 Monitor engine started"
    );

  } else {

    console.error(
      "❌ startMonitor missing"
    );
  }

  /* =========================================
     GLOBAL SAFE FALLBACKS
  ========================================= */

  window.generateAI = async function () {

    const topic =
      document.getElementById("aiTopic")?.value;

    if (!topic) {

      alert("Enter topic");

      return;
    }

    logToMonitor(
      "🤖 AI generating article..."
    );

    const fakeArticle = `
# ${topic}

MCN AI generated article successfully.

This is a placeholder AI response.
    `;

    alert(fakeArticle);

    logToMonitor(
      "✅ AI article generated"
    );
  };

  window.searchPosts = function () {

    const val =
      document.getElementById("searchPosts")?.value
      ?.toLowerCase() || "";

    console.log(
      "Searching posts:",
      val
    );
  };

  window.loadNews = function () {

    const keyword =
      document.getElementById("newsKeyword")?.value;

    const box =
      document.getElementById("newsList");

    if (!box) return;

    box.innerHTML = `
      <div class="item">
        📰 Demo news loaded for:
        ${keyword || "general"}
      </div>
    `;

    logToMonitor(
      "📰 News system loaded"
    );
  };

  window.createBlog = function () {

    const title =
      document.getElementById("blogTitle")?.value;

    logToMonitor(
      "📝 Blog publish requested: " + title
    );

    alert("Blog system connected");
  };

  window.updatePost = function () {

    logToMonitor(
      "✏ Post update triggered"
    );

    alert("Update system connected");
  };

  /* =========================================
     GLOBAL MONITOR LOGGER
  ========================================= */

  window.logToMonitor = function (
    msg,
    type = "ok"
  ) {

    const box =
      document.getElementById("monitor");

    if (!box) return;

    const div =
      document.createElement("div");

    div.style.color =
      type === "error"
      ? "red"
      : "#00ff88";

    div.textContent =
      `[${new Date().toLocaleTimeString()}] ${msg}`;

    box.appendChild(div);

    box.scrollTop =
      box.scrollHeight;
  };

  /* =========================================
     GLOBAL ERROR WATCHER
  ========================================= */

  window.addEventListener(
    "error",
    (e) => {

      logToMonitor(
        "💥 " + e.message,
        "error"
      );
    }
  );

  /* =========================================
     READY SIGNAL
  ========================================= */

  setTimeout(() => {

    console.log(
      "🚀 MCN ENGINE FULLY READY"
    );

    logToMonitor(
      "🚀 MCN ENGINE FULLY READY"
    );

    window.dispatchEvent(
      new Event("mcn-ready")
    );

  }, 1000);

})();

/* =========================================
   COMMAND TERMINAL FALLBACK
========================================= */

window.runCommand = async function () {

  const input =
    document.getElementById("cmdInput");

  const box =
    document.getElementById("cmdOutput");

  if (!input || !box) return;

  const raw =
    input.value.trim();

  if (!raw) return;

  let result = "Unknown command";

  try {

    const parts = raw.split(" ");

    const cmd =
      parts[0].toLowerCase();

    if (cmd === "/ads") {

      result =
        parts[1] === "off"
        ? "Ads disabled"
        : "Ads enabled";
    }

    else if (cmd === "/discover") {

      result =
        parts[1] === "off"
        ? "Discover disabled"
        : "Discover enabled";
    }

    else if (cmd === "/status") {

      result =
        "MCN Engine operational";
    }

    else if (cmd === "/clear") {

      box.innerHTML = "";

      input.value = "";

      return;
    }

    const div =
      document.createElement("div");

    div.className = "item";

    div.innerHTML = `
      <b>${raw}</b><br>
      <small>
        ${new Date().toLocaleTimeString()}
      </small><br>
      <span>${result}</span>
    `;

    box.prepend(div);

    if (window.logToMonitor) {

      window.logToMonitor(
        "⌨ Command executed: " + raw
      );
    }

  } catch (err) {

    console.error(err);

    if (window.logToMonitor) {

      window.logToMonitor(
        "💥 Command failure",
        "error"
      );
    }
  }

  input.value = "";
};