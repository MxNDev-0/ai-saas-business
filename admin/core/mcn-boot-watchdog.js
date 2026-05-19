/* =========================================
   MCN BOOT WATCHDOG v1
========================================= */

export function bootWatchdog(label = "MCN") {
  let bootOK = false;

  const timer = setTimeout(() => {
    if (!bootOK) {
      console.error("❌ BOOT STUCK:", label);

      if (window.logToMonitor) {
        window.logToMonitor("BOOT STUCK: " + label, "error");
      }

      const root = document.body;

      if (root) {
        root.innerHTML = `
          <div style="color:red;padding:20px;font-family:Arial;">
            ⚠ MCN ENGINE FAILED TO START<br><br>
            Please refresh or check modules.
          </div>
        `;
      }
    }
  }, 4000);

  return {
    success() {
      bootOK = true;
      clearTimeout(timer);
      console.log("✅ BOOT OK:", label);
    }
  };
}