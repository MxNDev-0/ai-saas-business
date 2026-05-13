import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  const box = document.getElementById("feed");

  if (box) {
    box.innerHTML = `
      <div class="post">
        <h3>📰 Content Feed</h3>
        <p>This system now displays curated content only (no social features).</p>
      </div>
    `;
  }

});