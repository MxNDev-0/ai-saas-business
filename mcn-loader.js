(function () {

  /* ===============================
     MCN ENGINE SINGLE LOADER
     =============================== */

  const loadScript = (src, type = "module") => {

    const s = document.createElement("script");

    s.src = src;

    if (type) s.type = type;

    document.head.appendChild(s);
  };

  /* ===============================
     CORE SYSTEM MODULES
     =============================== */

  // 🔴 Maintenance System (GLOBAL BLOCKER)
  loadScript("./maintenance-client.js");

  // 🔐 Future auth guard (optional)
  // loadScript("./auth-guard.js");

  // 📡 Future analytics / tracking
  // loadScript("./analytics.js");

  // 💬 Future chat system bootstrap
  // loadScript("./messages.js");

})();