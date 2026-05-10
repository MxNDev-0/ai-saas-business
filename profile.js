import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { auth } from "./firebase.js";

const db = getFirestore();

let viewedUser = null;

async function loadProfile(uid) {
  viewedUser = uid;

  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();

  document.getElementById("name").innerText = data.displayName;
  document.getElementById("username").innerText = "@" + data.username;
  document.getElementById("bio").innerText = data.bio;

  document.getElementById("avatar").src = data.photoURL;

  document.getElementById("followers").innerText = data.followers + " Followers";
  document.getElementById("following").innerText = data.following + " Following";
}

async function followUser() {
  const myId = auth.currentUser.uid;

  await updateDoc(doc(db, "users", viewedUser), {
    followers: increment(1)
  });

  await updateDoc(doc(db, "users", myId), {
    following: increment(1)
  });

  alert("Followed!");
}

document.getElementById("followBtn").onclick = followUser;

window.loadProfile = loadProfile;