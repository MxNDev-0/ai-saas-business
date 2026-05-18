import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { get } from "../core/dom.js";
import { MCN_STATE } from "../core/state.js";

export async function initAds() {
  const ref = collection(db, "adRequests");

  onSnapshot(ref, snap => {
    MCN_STATE.ads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAds();
  });
}

function renderAds() {
  const box = get("upgradeList");
  if (!box) return;

  box.innerHTML = "";

  MCN_STATE.ads.forEach(ad => {
    box.innerHTML += `
      <div class="item">
        <b>${ad.title}</b>
        <p>${ad.status}</p>

        <button onclick="MCN.approveAd('${ad.id}')">Approve</button>
        <button onclick="MCN.rejectAd('${ad.id}')">Reject</button>
      </div>
    `;
  });
}

export async function approveAd(id) {
  await updateDoc(doc(db, "adRequests", id), { status: "approved" });
}

export async function rejectAd(id) {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
}