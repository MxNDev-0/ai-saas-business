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

  document.body.innerHTML += "<h3 style='color:lime'>DOM IS WORKING</h3>";

  const box = document.getElementById("monitor");

  if (!box) {
    document.body.innerHTML += "<h3 style='color:orange'>MONITOR MISSING</h3>";
  } else {
    box.innerHTML = "MONITOR CONNECTED";
  }

  console.log("BOOT TEST COMPLETE");
});