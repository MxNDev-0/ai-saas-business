/* =========================================
   MCN MOBILE DIAGNOSTICS
========================================= */

(function () {

  const diagnostics = {

    userAgent:
      navigator.userAgent,

    online:
      navigator.onLine,

    language:
      navigator.language,

    memory:
      navigator.deviceMemory || "unknown",

    cores:
      navigator.hardwareConcurrency || "unknown",

    screen:
      `${screen.width}x${screen.height}`,

    platform:
      navigator.platform
  };

  console.table(diagnostics);

  window.mcnDiagnostics =
    diagnostics;

})();