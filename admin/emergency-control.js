/* =========================================
   MCN EMERGENCY CONTROL
========================================= */

let emergencyMode = false;

function bootEmergencyControl() {

  if (document.getElementById("mcnEmergencyFab"))
    return;

  const fab = document.createElement("button");

  fab.id = "mcnEmergencyFab";

  fab.innerHTML = "🚨";

  fab.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    width:60px;
    height:60px;
    border:none;
    border-radius:50%;
    background:#ff3b30;
    color:white;
    font-size:24px;
    z-index:999999;
    cursor:pointer;
    box-shadow:0 0 20px rgba(0,0,0,.4);
  `;

  fab.onclick = () => {

    emergencyMode = !emergencyMode;

    alert(
      emergencyMode
      ? "🚨 Emergency Mode Activated"
      : "✅ Emergency Mode Disabled"
    );

    console.log(
      "Emergency:",
      emergencyMode
    );
  };

  document.body.appendChild(fab);
}

bootEmergencyControl();