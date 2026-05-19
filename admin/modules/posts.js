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

const el = (id) => document.getElementById(id);

let posts = [];

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

    renderPosts();
  });
}

function renderPosts() {

  const box = document.getElementById("postsList");

  if (!box) return;

  try {

    if (!posts.length) {
      box.innerHTML = "<div class='item'>No posts yet</div>";
      return;
    }

    box.innerHTML = "";

    posts.forEach(p => {
      box.innerHTML += `
        <div class="item">
          <b>${p.title || "Untitled"}</b>
          <textarea>${p.content || ""}</textarea>
        </div>
      `;
    });

  } catch (e) {
    console.error("Render crash:", e);
    box.innerHTML = "<div style='color:red'>Render error</div>";
  }
}

export async function savePost(id) {

  await updateDoc(doc(db, "posts", id), {
    title: el(`t-${id}`).value,
    content: el(`c-${id}`).value
  });

  console.log("✅ Post updated");
}

export async function deletePost(id) {

  await deleteDoc(doc(db, "posts", id));

  console.log("🗑 Post deleted");
}

window.MCN = window.MCN || {};

window.MCN.savePost = savePost;
window.MCN.deletePost = deletePost;