import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function listenNotifications(uid, callback) {

  const q = query(
    collection(db, "events"),
    where("payload.to", "==", uid)
  );

  onSnapshot(q, snap => {

    const notes = [];

    snap.forEach(d => notes.push(d.data()));

    callback(notes);

  });

}