import { db } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function checkMaintenance() {

  try {

    const snap = await getDoc(
      doc(db, "system", "maintenance")
    );

    if (!snap.exists()) return;

    const data = snap.data();

    if (data.enabled === true) {

      const allowedPages = [

        "admin.html",

        "maintenance.html",

        "admin-pwa.html"
      ];

      const current =
        location.pathname.split("/").pop();

      const isAdminRoute =
        location.pathname.includes("/admin/");

      if (
        !allowedPages.includes(current)
        && !isAdminRoute
      ) {

        location.href =
          "./admin/maintenance.html";
      }
    }

  } catch (err) {

    console.error(err);
  }
}

checkMaintenance();