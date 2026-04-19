import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const debugBtn = document.getElementById("debugBtn");

debugBtn.addEventListener("click", async () => {
  console.clear();
  console.log("🛠 Running MCN Engine Debug...");

  // 🔥 Check Auth
  const user = auth.currentUser;
  if (user) {
    console.log("✅ User logged in:", user.email);
  } else {
    console.warn("⚠️ No user logged in");
  }

  // 🔥 Check Firestore connection
  try {
    const snapshot = await getDocs(collection(db, "posts"));
    console.log("📦 Posts found:", snapshot.size);

    snapshot.forEach((doc) => {
      console.log("📝 Post:", doc.data());
    });

  } catch (err) {
    console.error("❌ Firestore error:", err);
  }

  console.log("✅ Debug complete");
});