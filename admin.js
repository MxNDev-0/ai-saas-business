import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, getDoc, addDoc, collection, onSnapshot,
  deleteDoc, updateDoc, query, orderBy,
  getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg, type = "ok", clickableData = null) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    type === "ai" ? "#00c3ff" :
    "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;
  div.style.cursor = clickableData ? "pointer" : "default";

  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  /* 🔥 CLICK TO OPEN EVENT DETAILS */
  if (clickableData) {
    div.onclick = () => {
      log("---- EVENT DETAILS ----", "warn");
      Object.keys(clickableData).forEach(k => {
        log(`${k}: ${JSON.stringify(clickableData[k])}`);
      });
    };
  }

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      location.href = "index.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("User not found");
      location.href = "index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      alert("Access denied");
      location.href = "index.html";
      return;
    }

    log("Admin online");

    startAIMonitor();

    loadPosts();
    loadUsers();
    loadAds();
    loadRejectedAds();

  } catch (err) {
    console.error("AUTH ERROR:", err);
    log("Auth error: " + err.message, "error");
  }
});

/* ================= AI MONITOR (UPGRADED) ================= */
function startAIMonitor() {
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type !== "added") return;

      const e = change.doc.data();

      log(`Event: ${e.type}`, "ai", e); // 🔥 clickable event
    });
  }, (err) => {
    log("Event monitor error: " + err.message, "error");
  });
}

/* ================= BLOG ================= */
window.createBlog = async () => {
  try {
    const title = document.getElementById("blogTitle").value;
    const content = document.getElementById("blogContent").value;
    const image = document.getElementById("blogImage").value;

    if (!title || !content) {
      alert("Title and content required");
      return;
    }

    const ref = await addDoc(collection(db, "posts"), {
      title,
      content,
      image,
      createdAt: serverTimestamp()
    });

    /* 🔥 CREATE EVENT */
    await addDoc(collection(db, "events"), {
      type: "post_created",
      refId: ref.id,
      title,
      createdAt: serverTimestamp()
    });

    log("Blog created: " + ref.id);

  } catch (err) {
    log("Create blog error: " + err.message, "error");
  }
};

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = `<div class="item">No posts found</div>`;
      return;
    }

    snap.forEach(d => {
      const p = d.data();

      const safeTitle = encodeURIComponent(p.title || "");
      const safeContent = encodeURIComponent(p.content || "");

      box.innerHTML += `
        <div class="item">
          <b>${p.title || "Untitled"}</b><br>

          <button class="small-btn"
            onclick="fillEdit('${d.id}', '${safeTitle}', '${safeContent}')">
            Edit
          </button>

          <button class="small-btn"
            onclick="deletePost('${d.id}')">
            Delete
          </button>
        </div>
      `;
    });

  }, (err) => {
    log("Posts error: " + err.message, "error");
  });
}

/* ================= EDIT ================= */
window.fillEdit = (id, title, content) => {
  document.getElementById("editPostId").value = id;
  document.getElementById("editPostTitle").value = decodeURIComponent(title);
  document.getElementById("editPostContent").value = decodeURIComponent(content);
};

window.updatePost = async () => {
  try {
    const id = document.getElementById("editPostId").value;

    await updateDoc(doc(db, "posts", id), {
      title: document.getElementById("editPostTitle").value,
      content: document.getElementById("editPostContent").value
    });

    /* 🔥 EVENT */
    await addDoc(collection(db, "events"), {
      type: "post_updated",
      refId: id,
      createdAt: serverTimestamp()
    });

    log("Post updated");

  } catch (err) {
    log("Update error: " + err.message, "error");
  }
};

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));

  await addDoc(collection(db, "events"), {
    type: "post_deleted",
    refId: id,
    createdAt: serverTimestamp()
  });

  log("Post deleted", "warn");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), snap => {
    box.innerHTML = "";

    snap.forEach(u => {
      box.innerHTML += `<div class="item">${u.data().email}</div>`;
    });
  });
}

/* ================= ADS ================= */
function loadAds() {
  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), snap => {
    box.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${ad.title}</b><br>
          <button class="small-btn" onclick="acceptAd('${d.id}')">Accept</button>
          <button class="small-btn" onclick="rejectAd('${d.id}')">Reject</button>
        </div>
      `;
    });
  });
}

window.acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });

  await addDoc(collection(db, "events"), {
    type: "ad_accepted",
    refId: id,
    createdAt: serverTimestamp()
  });

  log("Ad accepted");
};

window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });

  log("Ad rejected", "warn");
};

/* ================= REJECTED ================= */
function loadRejectedAds() {
  const box = document.getElementById("rejectedList");

  onSnapshot(collection(db, "adRequests"), snap => {
    box.innerHTML = "";

    snap.forEach(d => {
      if (d.data().status === "rejected") {
        box.innerHTML += `<div class="item">❌ ${d.data().title}</div>`;
      }
    });
  });
}

window.clearRejected = async () => {
  const snap = await getDocs(collection(db, "adRequests"));
  const batch = writeBatch(db);

  snap.forEach(d => {
    if (d.data().status === "rejected") batch.delete(d.ref);
  });

  await batch.commit();
  log("Rejected ads cleared");
};