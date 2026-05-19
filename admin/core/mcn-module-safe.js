/* =========================================
   MCN MODULE SAFE WRAPPER v1
========================================= */

export function safeModule(fn, name = "module") {
  try {
    const result = fn();

    console.log("✅ Module loaded:", name);

    return result;

  } catch (e) {
    console.error("❌ Module failed:", name, e);

    if (window.logToMonitor) {
      window.logToMonitor("Module failed: " + name, "error");
    }

    return null;
  }
}