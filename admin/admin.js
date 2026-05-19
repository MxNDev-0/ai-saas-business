console.log("🔥 FILE LOADED: ADMIN LOADER");

window.onerror = function(msg, src, line, col, err) {
  document.body.innerHTML = `
    <div style="color:red;padding:20px;font-family:Arial">
      <h2>JS CRASH DETECTED</h2>
      <pre>${msg}\n${src}:${line}:${col}</pre>
    </div>
  `;
};

document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM check only");

  console.log("DOM OK");

  const box = document.getElementById("monitor");

  if (!box) {
    console.warn("MONITOR MISSING");
  } else {
    box.innerHTML = "MONITOR CONNECTED";
  }

  console.log("BOOT TEST COMPLETE");
});