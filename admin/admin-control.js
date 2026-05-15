import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN DASHBOARD CONTROL SYSTEM v1
========================================= */

const FEATURED_DOC = doc(db, "systemControls", "featured");
const SPONSORED_DOC = doc(db, "systemControls", "sponsored");
const ADS_DOC = doc(db, "systemControls", "ads");

/* ================= FEATURED ================= */

export async function setFeaturedPost(postId) {

  await setDoc(FEATURED_DOC, {
    postId,
    updatedAt: serverTimestamp()
  });

  console.log("🔥 Featured post updated:", postId);
}

/* ================= SPONSORED ================= */

export async function setSponsored(postId, slot = "feed") {

  await setDoc(SPONSORED_DOC, {
    postId,
    slot,
    active: true,
    updatedAt: serverTimestamp()
  });

  console.log("💰 Sponsored set:", postId, slot);
}

/* ================= ADS CONTROL ================= */

export async function setAdPlacement(placement, enabled) {

  const snap = await getDoc(ADS_DOC);

  let data = snap.exists() ? snap.data() : {};

  data[placement] = enabled;

  await setDoc(ADS_DOC, data);

  console.log("📢 Ad updated:", placement, enabled);
}

/* ================= LIVE CONTROL WATCHER ================= */

export function watchControls(callback) {

  onSnapshot(FEATURED_DOC, (snap1) => {
    onSnapshot(SPONSORED_DOC, (snap2) => {
      onSnapshot(ADS_DOC, (snap3) => {

        callback({
          featured: snap1.data() || null,
          sponsored: snap2.data() || null,
          ads: snap3.data() || {}
        });

      });
    });
  });
}