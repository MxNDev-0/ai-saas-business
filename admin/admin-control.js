import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN CONTROL CENTER V19
========================================= */

/* FEATURED */
export async function setFeatured(postId) {

  await setDoc(doc(db, "systemControls", "featured"), {
    postId,
    updatedAt: serverTimestamp()
  });

  console.log("🔥 Featured updated:", postId);
}

/* SPONSORED */
export async function setSponsored(postId, slot) {

  await setDoc(doc(db, "systemControls", "sponsored"), {
    postId,
    slot,
    active: true,
    updatedAt: serverTimestamp()
  });

  console.log("💰 Sponsored updated:", postId, slot);
}

/* ADS TOGGLE */
export async function toggleAd(type, value) {

  await setDoc(doc(db, "systemControls", "ads"), {
    [type]: value,
    updatedAt: serverTimestamp()
  }, { merge: true });

  console.log("📢 Ads updated:", type, value);
}

/* LIVE WATCH */
export function watchControls(cb) {

  const ref = doc(db, "systemControls", "featured");

  onSnapshot(ref, () => {
    cb();
  });
}