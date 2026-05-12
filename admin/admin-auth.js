import { auth, db } from "../firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Central Admin Auth Layer
 * Used by ALL admin modules
 */

export async function requireAdmin() {
  return new Promise((resolve, reject) => {

    auth.onAuthStateChanged(async (user) => {

      if (!user) {
        location.href = "../index.html";
        return reject("No user");
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          location.href = "../index.html";
          return reject("No profile");
        }

        const data = snap.data();

        if (data.role !== "admin") {
          location.href = "../index.html";
          return reject("Not admin");
        }

        resolve(user);

      } catch (err) {
        console.error("Admin auth error:", err);
        location.href = "../index.html";
        reject(err);
      }
    });

  });
}