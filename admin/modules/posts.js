import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

window.MCN_STATE = window.MCN_STATE || {
  posts: []
};

let posts = window.MCN_STATE.posts;

/* ================= CORE ================= */

export async function initPosts() {

  console.log("📡 Posts module active");

  const qRef = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(qRef, snap => {

    posts = [];

    snap.forEach(d => {
      posts.push({
        id: d.id,
        ...d.data()
      });
    });

    window.MCN_STATE.posts = posts;

    renderPosts();
  });
}

/* ================= RENDER (SAFE + CLEAN) ================= */

function renderPosts() {

  const box = document.getElementById("postsList");

  if (!box) return;

  try {

    if (!posts.length) {
      box.innerHTML = `<div class="item">No posts yet</div>`;
      return;
    }

    box.innerHTML = posts.map(p => `
      <div class="item" data-id="${p.id}">

        <b>${escapeHtml(p.title || "Untitled")}</b>

        <input
          class="post-title"
          value="${escapeHtml(p.title || "")}"
        />

        <textarea class="post-content">${escapeHtml(p.content || "")}</textarea>

        <div style="display:flex; gap:8px; margin-top:8px;">

          <button data-action="save">Save</button>
          <button data-action="delete" class="danger">Delete</button>

        </div>

      </div>
    `).join("");

    bindActions();

  } catch (e) {
    console.error("Render crash:", e);
    box.innerHTML = `<div style="color:red">Render error</div>`;
  }
}

/* ================= EVENT BINDING (IMPORTANT FIX) ================= */

function bindActions() {

  document.querySelectorAll("#postsList .item").forEach(card => {

    const id = card.getAttribute("data-id");

    const saveBtn = card.querySelector('[data-action="save"]');
    const delBtn = card.querySelector('[data-action="delete"]');

    const titleInput = card.querySelector(".post-title");
    const contentInput = card.querySelector(".post-content");

    if (saveBtn) {
      saveBtn.onclick = async () => {
        await updateDoc(doc(db, "posts", id), {
          title: titleInput.value,
          content: contentInput.value
        });

        console.log("✅ Post updated:", id);
      };
    }

    if (delBtn) {
      delBtn.onclick = async () => {
        await deleteDoc(doc(db, "posts", id));
        console.log("🗑 Post deleted:", id);
      };
    }
  });
}

/* ================= SECURITY HELPER ================= */

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= OPTIONAL API ================= */

export function savePost(id, data) {
  return updateDoc(doc(db, "posts", id), data);
}

export function deletePost(id) {
  return deleteDoc(doc(db, "posts", id));
}