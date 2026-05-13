/* =========================================
   MCN EMERGENCY CONTROL
========================================= */

let emergencyActive = false;

function createEmergencyWidget() {

  if (
    document.getElementById(
      "mcnEmergencyPanel"
    )
  ) return;

  const panel =
    document.createElement("div");

  panel.id =
    "mcnEmergencyPanel";

  panel.style.cssText = `
    position:fixed;
    left:10px;
    bottom:90px;
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

    <div id="emergencyMiniBtn"
      style="
        padding:12px;
        text-align:center;
        cursor:pointer;
        background:#0b132b;
        font-size:20px;
      ">
      🚨
    </div>

    <div id="emergencyContent"
      style="
        max-height:0;
        overflow:hidden;
        padding:0 12px;
        transition:all 0.3s ease;
      ">

      <h3>Emergency Control</h3>

      <button id="activateEmergency"
        style="
          width:100%;
          padding:10px;
          border:none;
          border-radius:10px;
          background:#5bc0be;
          font-weight:bold;
          margin-bottom:10px;
          cursor:pointer;
        ">
        ACTIVATE
      </button>

      <button id="disableEmergency"
        style="
          width:100%;
          padding:10px;
          border:none;
          border-radius:10px;
          background:red;
          color:white;
          font-weight:bold;
          cursor:pointer;
        ">
        DISABLE
      </button>

      <p id="emergencyStatus">
        Status: NORMAL
      </p>

    </div>
  `;

  document.body.appendChild(panel);

  const miniBtn =
    document.getElementById(
      "emergencyMiniBtn"
    );

  const content =
    document.getElementById(
      "emergencyContent"
    );

  let expanded = false;

  miniBtn.onclick = () => {

    expanded = !expanded;

    if (expanded) {

      panel.style.width = "260px";

      content.style.maxHeight =
        "400px";

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

  document
    .getElementById(
      "activateEmergency"
    )
    .onclick = activateEmergency;

  document
    .getElementById(
      "disableEmergency"
    )
    .onclick = disableEmergency;
}

/* ================= ACTIVATE ================= */

function activateEmergency() {

  emergencyActive = true;

  const status =
    document.getElementById(
      "emergencyStatus"
    );

  if (status) {

    status.innerHTML =
      "Status: ACTIVE 🚨";
  }

  console.log(
    "🚨 Emergency Mode Activated"
  );
}

/* ================= DISABLE ================= */

function disableEmergency() {

  emergencyActive = false;

  const status =
    document.getElementById(
      "emergencyStatus"
    );

  if (status) {

    status.innerHTML =
      "Status: NORMAL";
  }

  console.log(
    "✅ Emergency Mode Disabled"
  );
}

/* ================= BOOT ================= */

createEmergencyWidget();