import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg, type = "ok") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error"
      ? "red"
      : type === "warn"
      ? "orange"
      : "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= ADMIN AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  try {

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("User not found");
      location.href = "index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      alert("Admin access only");
      location.href = "dashboard.html";
      return;
    }

    log("Admin online");

    loadPosts();
    loadUsers();
    loadAds();
    loadRejectedAds();

  } catch (err) {

    console.error(err);
    alert("Admin auth failed");
  }
});

/* ================= CREATE BLOG ================= */
window.createBlog = async () => {

  try {

    const post = {
      title: blogTitle.value,
      content: blogContent.value,
      image: blogImage.value,
      createdAt: serverTimestamp(),

      visibility: {
        homepage: c_homepage.checked,
        featured: c_featured.checked,
        trending: c_trending.checked,
        dashboard: true
      },

      sponsored: {
        isSponsored: c_sponsored.checked,
        expiresAt: adExpiry.value
          ? new Date(adExpiry.value).getTime()
          : null,
        priority: Number(adPriority.value || 0)
      },

      metrics: {
        impressions: 0,
        clicks: 0
      },

      admin: {
        approved: true
      }
    };

    const ref = await addDoc(collection(db, "posts"), post);

    log("Blog created: " + ref.id);

    blogTitle.value = "";
    blogContent.value = "";
    blogImage.value = "";

  } catch (err) {

    console.error(err);
    log("Create failed", "error");
  }
};

/* ================= POSTS ================= */
function loadPosts() {

  const box = document.getElementById("postsList");

  if (!box) return;

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    if (snap.empty) {

      box.innerHTML = `
        <div class="item">
          No posts yet
        </div>
      `;

      return;
    }

    snap.forEach((d) => {

      const p = d.data();

      const featured =
        p.visibility?.featured ? "⭐ FEATURED" : "";

      const published =
        p.admin?.approved !== false;

      box.innerHTML += `

        <div class="item">

          <b>${p.title || "Untitled Post"}</b>

          <br><br>

          ${featured}

          <br>

          Homepage:
          ${p.visibility?.homepage ? "✔" : "✖"}

          |

          Trending:
          ${p.visibility?.trending ? "✔" : "✖"}

          |

          Sponsored:
          ${p.sponsored?.isSponsored ? "✔" : "✖"}

          <br><br>

          Status:
          <span style="
            color:${published ? "#00ff88" : "orange"};
            font-weight:bold;
          ">
            ${published ? "PUBLISHED" : "HIDDEN"}
          </span>

          <br><br>

          <button
            class="small-btn"
            onclick="fillEdit('${d.id}')">

            Edit

          </button>

          <button
            class="small-btn"
            onclick="togglePost('${d.id}', ${published})">

            ${published ? "Hide" : "Publish"}

          </button>

          <button
            class="small-btn"
            style="background:red;color:white;"
            onclick="deletePost('${d.id}')">

            Delete

          </button>

        </div>
      `;
    });

  }, (err) => {

    console.error(err);

    log("Failed loading posts", "error");
  });
}

/* ================= TOGGLE POST ================= */
window.togglePost = async (id, currentState) => {

  try {

    await updateDoc(doc(db, "posts", id), {

      "admin.approved": !currentState

    });

    log(
      currentState
        ? "Post hidden"
        : "Post published"
    );

  } catch (err) {

    console.error(err);

    log("Toggle failed", "error");
  }
};

/* ================= EDIT ================= */
window.fillEdit = async (id) => {

  const snap = await getDoc(doc(db, "posts", id));

  if (!snap.exists()) {
    alert("Post not found");
    return;
  }

  const p = snap.data();

  editPostId.value = id;
  editPostTitle.value = p.title || "";
  editPostContent.value = p.content || "";

  e_homepage.checked = p.visibility?.homepage || false;
  e_featured.checked = p.visibility?.featured || false;
  e_trending.checked = p.visibility?.trending || false;
  e_sponsored.checked = p.sponsored?.isSponsored || false;

  e_adPriority.value = p.sponsored?.priority || 0;

  e_adExpiry.value = p.sponsored?.expiresAt
    ? new Date(p.sponsored.expiresAt)
        .toISOString()
        .slice(0, 16)
    : "";
};

/* ================= UPDATE POST ================= */
window.updatePost = async () => {

  try {

    const id = editPostId.value;

    await updateDoc(doc(db, "posts", id), {

      title: editPostTitle.value,
      content: editPostContent.value,

      visibility: {
        homepage: e_homepage.checked,
        featured: e_featured.checked,
        trending: e_trending.checked,
        dashboard: true
      },

      sponsored: {
        isSponsored: e_sponsored.checked,
        expiresAt: e_adExpiry.value
          ? new Date(e_adExpiry.value).getTime()
          : null,
        priority: Number(e_adPriority.value || 0)
      }
    });

    log("Post updated");

  } catch (err) {

    console.error(err);
    log("Update failed", "error");
  }
};

/* ================= DELETE ================= */
window.deletePost = async (id) => {

  try {

    await deleteDoc(doc(db, "posts", id));

    log("Post deleted", "warn");

  } catch (err) {

    console.error(err);
    log("Delete failed", "error");
  }
};

/* ================= USERS ================= */
function loadUsers() {

  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "users"), (snap) => {

    box.innerHTML = "";

    snap.forEach(d => {

      const u = d.data();

      box.innerHTML += `
        <div class="item">
          ${u.email || "Unknown User"}
        </div>
      `;
    });
  });
}

/* ================= ADS ================= */
function loadAds() {

  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach(d => {

      const ad = d.data();

      if (ad.status === "rejected") return;

      box.innerHTML += `
        <div class="item">

          <b>${ad.title || "Untitled Ad"}</b>

          <br><br>

          <button class="small-btn"
            onclick="acceptAd('${d.id}')">
            Accept
          </button>

          <button class="small-btn"
            onclick="rejectAd('${d.id}')">
            Reject
          </button>

        </div>
      `;
    });
  });
}

window.acceptAd = async (id) => {

  await updateDoc(doc(db, "adRequests", id), {
    status: "accepted"
  });

  log("Ad accepted");
};

window.rejectAd = async (id) => {

  await updateDoc(doc(db, "adRequests", id), {
    status: "rejected"
  });

  log("Ad rejected", "warn");
};

/* ================= REJECTED ADS ================= */
function loadRejectedAds() {

  const box = document.getElementById("rejectedList");

  onSnapshot(collection(db, "adRequests"), (snap) => {

    box.innerHTML = "";

    snap.forEach(d => {

      const ad = d.data();

      if (ad.status === "rejected") {

        box.innerHTML += `
          <div class="item">
            ❌ ${ad.title}
          </div>
        `;
      }
    });
  });
}

window.clearRejected = async () => {

  const snap = await getDocs(collection(db, "adRequests"));

  const batch = writeBatch(db);

  snap.forEach(d => {

    if (d.data().status === "rejected") {
      batch.delete(d.ref);
    }
  });

  await batch.commit();

  log("Rejected ads cleared");
};