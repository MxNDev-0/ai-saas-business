import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

/* ================= LOGGER ================= */
function log(msg) {

  const monitor =
    document.getElementById("monitor");

  monitor.innerHTML += "<br>" + msg;

  monitor.scrollTop =
    monitor.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  log("[AUTH] " + user.email);

  await createUserProfile(user);

  trackPresence();

  loadOnlineUsers();
});

/* ================= CREATE PROFILE ================= */
async function createUserProfile(user) {

  try {

    const ref =
      doc(db, "users", user.uid);

    const snap =
      await getDoc(ref);

    if (!snap.exists()) {

      await setDoc(ref, {

        uid: user.uid,

        email: user.email,

        username:
          user.email.split("@")[0],

        photoURL: "",

        bio: "MCN Engine User",

        followers: 0,

        following: 0,

        role: "user",

        online: true,

        lastSeen: Date.now(),

        createdAt: Date.now()
      });

      log("[PROFILE] Created");

    } else {

      await updateDoc(ref, {

        online: true,

        lastSeen: Date.now()
      });

      log("[PROFILE] Updated");
    }

  } catch (err) {

    console.error(err);

    log("[ERROR] profile setup failed");
  }
}

/* ================= ONLINE TRACKING ================= */
function trackPresence() {

  setInterval(async () => {

    if (!currentUser) return;

    try {

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
          online: true,
          lastSeen: Date.now()
        }
      );

      log("[PING] online");

    } catch (err) {

      console.error(err);
    }

  }, 15000);
}

/* ================= ONLINE USERS ================= */
function loadOnlineUsers() {

  const q = query(
    collection(db, "users"),
    where("online", "==", true)
  );

  onSnapshot(q, (snap) => {

    const users = [];

    snap.forEach((docSnap) => {

      const data = docSnap.data();

      const now = Date.now();

      if (
        now - (data.lastSeen || 0)
        < 30000
      ) {
        users.push(data);
      }
    });

    log(
      "[USERS] "
      + users.length
      + " online"
    );

    renderUsers(users);
  });
}

/* ================= RENDER USERS ================= */
function renderUsers(users) {

  const box =
    document.getElementById("onlineUsers");

  box.innerHTML = "";

  users.forEach((u) => {

    if (u.uid === currentUser.uid)
      return;

    const row =
      document.createElement("div");

    row.className = "user-row";

    row.innerHTML = `

      <div class="user-left">

        <span class="dot"></span>

        <div>

          <div>
            ${u.username || "user"}
          </div>

          <small style="
            opacity:0.7;
          ">
            ${u.bio || ""}
          </small>

        </div>

      </div>

      <div class="user-actions">

        <button
          onclick="openDM('${u.uid}')"
        >
          ✉️ DM
        </button>

      </div>
    `;

    box.appendChild(row);
  });
}

/* ================= MONITOR ================= */
window.sendMonitorMsg = function () {

  const input =
    document.getElementById("monitorInput");

  if (!input.value.trim())
    return;

  log("[CMD] " + input.value);

  input.value = "";
};

/* ================= OPEN DM ================= */
window.openDM = function(uid) {

  location.href =
    "user.html?uid=" + uid;
};

/* ================= OFFLINE CLEANUP ================= */
window.addEventListener(
  "beforeunload",
  async () => {

    if (!currentUser) return;

    try {

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
          online: false,
          lastSeen: Date.now()
        }
      );

    } catch (err) {}
});