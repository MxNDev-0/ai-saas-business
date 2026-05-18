import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { get } from "../core/dom.js";
import { MCN_STATE } from "../core/state.js";

export async function initSupport() {
  const ref = collection(db, "supportChats");

  onSnapshot(ref, snap => {
    const users = snap.docs.map(d => d.id);
    renderUsers(users);
  });
}

function renderUsers(users) {
  const box = get("supportUsers");
  if (!box) return;

  box.innerHTML = "";

  users.forEach(u => {
    box.innerHTML += `
      <div class="item">
        👤 ${u}
        <button onclick="MCN.openChat('${u}')">Open</button>
      </div>
    `;
  });
}

export function openChat(uid) {
  MCN_STATE.selectedUser = uid;

  const ref = collection(db, "supportChats", uid, "messages");

  onSnapshot(ref, snap => {
    const box = get("supportMessages");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${m.sender}</b><br>${m.text}
        </div>
      `;
    });
  });

  document.getElementById("sendSupportReply").onclick = async () => {
    const input = document.getElementById("supportReply");

    if (!input.value) return;

    await addDoc(ref, {
      text: input.value,
      sender: "admin",
      createdAt: serverTimestamp()
    });

    input.value = "";
  };
}