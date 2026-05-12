import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL STATE ================= */

export let MCN = {
  user: null,
  profile: null
};

/* ================= INIT USER ================= */

export async function initMCN(user) {

  MCN.user = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(ref, {
      uid: user.uid,
      username: user.email.split("@")[0],
      photo: "",
      bio: "MCN User",
      followers: [],
      following: [],
      createdAt: Date.now()
    });

  }

  MCN.profile = (await getDoc(ref)).data();

  return MCN.profile;
}

/* ================= EVENT SYSTEM ================= */

export async function emitEvent(type, payload) {

  await addDoc(collection(db, "events"), {
    type,
    payload,
    from: MCN.user.uid,
    createdAt: serverTimestamp()
  });

}