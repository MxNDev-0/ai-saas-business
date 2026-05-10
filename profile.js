import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// ===== FIREBASE INIT (replace with your config) =====
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let viewedUser = null;

// ===== LOAD PROFILE =====
async function loadProfile(uid) {
  try {
    viewedUser = uid;

    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      document.getElementById("loading").innerText = "User not found";
      return;
    }

    const data = snap.data();

    document.getElementById("loading").style.display = "none";
    document.getElementById("avatar").style.display = "block";

    document.getElementById("name").innerText = data.displayName || "No Name";
    document.getElementById("username").innerText = "@" + (data.username || "user");
    document.getElementById("bio").innerText = data.bio || "No bio yet";

    document.getElementById("avatar").src = data.photoURL || "default.png";

    document.getElementById("followers").innerText = (data.followers || 0) + " Followers";
    document.getElementById("following").innerText = (data.following || 0) + " Following";

  } catch (err) {
    document.getElementById("loading").innerText = "Error loading profile";
    console.error(err);
  }
}

// ===== FOLLOW SYSTEM =====
async function followUser() {
  const user = auth.currentUser;
  if (!user || !viewedUser) return;

  await updateDoc(doc(db, "users", viewedUser), {
    followers: increment(1)
  });

  await updateDoc(doc(db, "users", user.uid), {
    following: increment(1)
  });

  alert("Followed!");
}

// ===== SAFE AUTH LOADING =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadProfile(user.uid);
  } else {
    document.getElementById("loading").innerText = "Please login";
  }
});

// ===== EVENTS =====
document.getElementById("followBtn").onclick = followUser;