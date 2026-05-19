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

  const box = el("postsList");
  const dash = el("dashPosts");

  if (!box) return;

  box.innerHTML = "";

  if (dash) dash.innerHTML = "";

  posts.forEach(p => {

    box.innerHTML += `
      <div class="item">
        <b>${p.title || "Untitled"}</b>

        <input id="t-${p.id}" value="${p.title || ""}">

        <textarea id="c-${p.id}">${p.content || ""}</textarea>

        <button onclick="MCN.savePost('${p.id}')">
          Save
        </button>

        <button
          onclick="MCN.deletePost('${p.id}')"
          class="danger">

          Delete

        </button>
      </div>
    `;

    if (dash) {
      dash.innerHTML += `
        <div class="item">
          ${p.title || "Untitled"}
        </div>
      `;
    }
  });
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