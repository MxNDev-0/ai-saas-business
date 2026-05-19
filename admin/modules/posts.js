import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let posts = [];

export function initPosts() {
  const box = () => document.getElementById("postsList");

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    render();
  });

  function render() {
    const el = box();

    if (!el) return console.warn("postsList missing");

    if (posts.length === 0) {
      el.innerHTML = "<div class='item'>No posts</div>";
      return;
    }

    el.innerHTML = posts.map(p => `
      <div class="item">
        <b>${p.title || "Untitled"}</b>
        <div>${p.content || ""}</div>
      </div>
    `).join("");
  }
}