export function runDiagnostics() {

  const report = {
    screen: window.innerWidth + "x" + window.innerHeight,
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    memory: navigator.deviceMemory || "unknown",
    time: new Date().toISOString()
  };

  console.log("📊 MCN Diagnostics:", report);

  alert(
    "Device Check:\n" +
    JSON.stringify(report, null, 2)
  );
}