import { db } from "../firebase.js";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const el = (id) => document.getElementById(id);

export async function initSupport() {

  const ref = collection(db, "supportChats");

  onSnapshot(ref, snap => {

    const users = [];

    snap.forEach(d => users.push(d.id));

    renderUsers(users);
  });
}

function renderUsers(users) {

  const box = el("supportUsers");

  if (!box) return;

  box.innerHTML = "";

  users.forEach(uid => {

    box.innerHTML += `
      <div class="item">

        👤 ${uid}

        <button onclick="MCN.openChat('${uid}')">
          Open
        </button>

      </div>
    `;
  });
}

export function openChat(uid) {

  const ref = collection(
    db,
    "supportChats",
    uid,
    "messages"
  );

  onSnapshot(ref, snap => {

    const box = el("supportMessages");

    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {

      const m = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${m.sender}</b><br>
          ${m.text}
        </div>
      `;
    });
  });

  const btn = el("sendSupportReply");

  if (!btn) return;

  btn.onclick = async () => {

    const input = el("supportReply");

    if (!input.value) return;

    await addDoc(ref, {
      text: input.value,
      sender: "admin",
      createdAt: serverTimestamp()
    });

    input.value = "";
  };
}