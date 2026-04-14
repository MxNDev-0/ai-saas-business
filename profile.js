import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* MENU */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "none" ? "block" : "none";
};

window.contactSupport = () => {
  alert("Contact saved");
};

/* USER */
onAuthStateChanged(auth, (user) => {
  if (!user) location.href = "index.html";

  document.getElementById("userEmail").innerText = user.email;

  listenPosts();
});

/* POST */
window.createPost = async () => {
  const text = document.getElementById("postText").value;

  await addDoc(collection(db, "posts"), {
    text,
    user: "profile-user",
    time: Date.now()
  });

  document.getElementById("postText").value = "";
};

/* FEED */
function listenPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      box.innerHTML += `<div><b>${p.user}</b><p>${p.text}</p></div>`;
    });
  });
}