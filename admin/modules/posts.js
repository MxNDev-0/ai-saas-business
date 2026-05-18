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

import { get } from "../core/dom.js";
import { MCN_STATE } from "../core/state.js";

export async function initPosts() {
  console.log("📡 Posts module loading...");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, snap => {
    MCN_STATE.posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderPosts();
  });
}

function renderPosts() {
  const box = get("postsList");
  const dash = get("dashPosts");

  if (!box || !dash) return;

  box.innerHTML = "";
  dash.innerHTML = "";

  MCN_STATE.posts.forEach(p => {
    box.innerHTML += `
      <div class="item">
        <b>${p.title}</b>
        <textarea id="c-${p.id}">${p.content || ""}</textarea>

        <button onclick="MCN.savePost('${p.id}')">Save</button>
        <button onclick="MCN.deletePost('${p.id}')" class="danger">Delete</button>
      </div>
    `;

    dash.innerHTML += `<div class="item">${p.title}</div>`;
  });
}

/* PUBLIC ACTIONS */
export async function savePost(id) {
  const content = document.getElementById(`c-${id}`)?.value;

  await updateDoc(doc(db, "posts", id), { content });
}

export async function deletePost(id) {
  await deleteDoc(doc(db, "posts", id));
}