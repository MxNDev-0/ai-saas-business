import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  onSnapshot,
  serverTimestamp,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;

let chatId = null;

let targetUser = null;

let unsubscribeMessages = null;

let unsubscribeInbox = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

  if(!user){

    location.href = "index.html";
    return;

  }

  currentUser = user;

  loadInbox();

  checkDirectOpen();

});

/* ================= HELPERS ================= */

function id(a,b){

  return [a,b].sort().join("_");

}

async function getUser(uid){

  const snap =
    await getDoc(
      doc(db,"users",uid)
    );

  if(!snap.exists()){

    return {
      uid,
      username:"Unknown User",
      photo:"",
      lastActive:0
    };

  }

  return snap.data();

}

/* ================= DIRECT OPEN ================= */

async function checkDirectOpen(){

  const params =
    new URLSearchParams(
      location.search
    );

  const uid =
    params.get("uid");

  if(uid){

    openChat(uid);

  }

}

/* ================= OPEN CHAT ================= */

window.openChat = async function(uid){

  try{

    chatId =
      id(currentUser.uid,uid);

    targetUser =
      await getUser(uid);

    document.getElementById(
      "chatUsername"
    ).textContent =
      targetUser.username || "User";

    document.getElementById(
      "chatAvatar"
    ).src =
      targetUser.photo ||
      "https://via.placeholder.com/100";

    /* ONLINE STATUS */

    const typing =
      document.getElementById(
        "typingIndicator"
      );

    const online =
      Date.now() -
      (targetUser.lastActive || 0)
      < 120000;

    typing.textContent =
      online
      ? "🟢 Online"
      : "⚫ Offline";

    document.getElementById(
      "chatScreen"
    ).classList.add("active");

    loadMessages();

  }catch(err){

    console.error(err);

  }

};

/* ================= SEND MESSAGE ================= */

window.sendMsg = async function(){

  try{

    const input =
      document.getElementById(
        "msgInput"
      );

    const text =
      input.value.trim();

    if(!text || !chatId)
      return;

    input.value = "";

    await addDoc(
      collection(
        db,
        "dms",
        chatId,
        "messages"
      ),
      {
        text,
        senderId:
          currentUser.uid,
        receiverId:
          targetUser.uid,
        createdAt:
          serverTimestamp(),
        seen:false
      }
    );

    await setDoc(
      doc(db,"dms",chatId),
      {
        members:[
          currentUser.uid,
          targetUser.uid
        ],
        lastMessage:text,
        updatedAt:
          serverTimestamp(),
        lastSender:
          currentUser.uid
      },
      { merge:true }
    );

  }catch(err){

    console.error(err);

    alert(
      "Failed to send message"
    );

  }

};

/* ================= ENTER TO SEND ================= */

document.addEventListener(
  "keydown",
  (e)=>{

    const input =
      document.getElementById(
        "msgInput"
      );

    if(
      e.key === "Enter" &&
      document.activeElement === input
    ){

      e.preventDefault();

      sendMsg();

    }

  }
);

/* ================= LOAD MESSAGES ================= */

function loadMessages(){

  if(unsubscribeMessages){

    unsubscribeMessages();

  }

  const q =
    query(
      collection(
        db,
        "dms",
        chatId,
        "messages"
      ),
      orderBy(
        "createdAt",
        "asc"
      )
    );

  unsubscribeMessages =
    onSnapshot(q,(snap)=>{

      const box =
        document.getElementById(
          "chatBox"
        );

      box.innerHTML = "";

      snap.forEach((d)=>{

        const m = d.data();

        const