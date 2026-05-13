/* =========================================
   MCN MOBILE DIAGNOSTICS
========================================= */

function createDiagnosticsWidget() {

  if (
    document.getElementById(
      "mcnDiagnosticsPanel"
    )
  ) return;

  const panel =
    document.createElement("div");

  panel.id =
    "mcnDiagnosticsPanel";

  panel.style.cssText = `
    position:fixed;
    left:10px;
    bottom:10px;
    width:55px;
    background:#1c2541;
    color:white;
    border-radius:14px;
    overflow:hidden;
    z-index:999999;
    box-shadow:0 0 20px rgba(0,0,0,0.4);
    transition:all 0.3s ease;
    font-family:Arial;
  `;

  panel.innerHTML = `

    <div id="diagnosticsMiniBtn"
      style="
        padding:12px;
        text-align:center;
        cursor:pointer;
        background:#0b132b;
        font-size:18px;
      ">
      📡
    </div>

    <div id="diagnosticsContent"
      style="
        max-height:0;
        overflow:hidden;
        padding:0 12px;
        transition:all 0.3s ease;
        font-size:13px;
        line-height:1.7;
      ">

      <h3>Diagnostics</h3>

      Health: 100%

      <br>

      Mode: NORMAL

      <br>

      Network:
      ${navigator.onLine ? "ONLINE" : "OFFLINE"}

      <br>

      Platform:
      ${navigator.platform}

    </div>
  `;

  document.body.appendChild(panel);

  const miniBtn =
    document.getElementById(
      "diagnosticsMiniBtn"
    );

  const content =
    document.getElementById(
      "diagnosticsContent"
    );

  let expanded = false;

  miniBtn.onclick = () => {

    expanded = !expanded;

    if (expanded) {

      panel.style.width = "230px";

      content.style.maxHeight =
        "300px";

      content.style.padding =
        "12px";

    } else {

      panel.style.width = "55px";

      content.style.maxHeight =
        "0";

      content.style.padding =
        "0 12px";
    }
  };
}

/* ================= BOOT ================= */

createDiagnosticsWidget();