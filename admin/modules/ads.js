import { db } from "../firebase.js";

import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const el = (id) => document.getElementById(id);

let ads = [];

export async function initAds() {

  const ref = collection(db, "adRequests");

  onSnapshot(ref, snap => {

    ads = [];

    snap.forEach(d => {
      ads.push({
        id: d.id,
        ...d.data()
      });
    });

    renderAds();
  });
}

function renderAds() {

  const box = el("upgradeList");

  if (!box) return;

  box.innerHTML = "";

  ads.forEach(ad => {

    box.innerHTML += `
      <div class="item">

        <b>${ad.title || "Ad Request"}</b><br>

        ${ad.status || "pending"}

        <button onclick="MCN.approveAd('${ad.id}')">
          Approve
        </button>

        <button onclick="MCN.rejectAd('${ad.id}')">
          Reject
        </button>

      </div>
    `;
  });
}

export async function approveAd(id) {

  await updateDoc(doc(db, "adRequests", id), {
    status: "approved"
  });
}

export async function rejectAd(id) {

  await updateDoc(doc(db, "adRequests", id), {
    status: "rejected"
  });
}