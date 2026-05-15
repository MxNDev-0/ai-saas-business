import { db } from "./firebase.js";
import {
  doc,
  onSnapshot,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN CONTROL BUS (REALTIME SYSTEM CORE)
========================================= */

export function watchControls(callback) {

  const ref = doc(db, "system", "controls");

  return onSnapshot(ref, (snap) => {

    const data = snap.exists() ? snap.data() : {};

    window.MCN_CONTROLS = data;

    callback(data);

  });
}

export async function setControl(key, value) {

  const ref = doc(db, "system", "controls");

  await setDoc(ref, {
    [key]: value
  }, { merge: true });

}