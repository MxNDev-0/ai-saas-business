import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN LIVE SUPPORT CHAT SYSTEM
========================================= */

const panel =
  document.getElementById("chatPanel");

const box =
  document.getElementById("chatBox");

const input =
  document.getElementById("chatInput");

let currentUID = null;

/* =========================================
   TOGGLE CHAT
========================================= */

window.toggleChat = function () {

  if (!panel) return;

  panel.style.display =
    panel.style.display === "flex"
    ? "none"
    : "flex";
};

/* =========================================
   AUTO AUTH
========================================= */

onAuthStateChanged(auth, async(user)=>{

  if(user){

    currentUID = user.uid;

    startMessages();

  } else {

    try {

      const cred =
        await signInAnonymously(auth);

      currentUID =
        cred.user.uid;

      startMessages();

    } catch(err){

      console.error(
        "Anonymous auth failed",
        err
      );
    }
  }

});

/* =========================================
   LOAD MESSAGES
========================================= */

function startMessages(){

  if(!currentUID) return;

  const q =
    query(
      collection(
        db,
        "supportChats",
        currentUID,
        "messages"
      ),
      orderBy("createdAt")
    );

  onSnapshot(q,(snap)=>{

    if(!box) return;

    box.innerHTML = "";

    snap.forEach(docSnap=>{

      const m =
        docSnap.data();

      const div =
        document.createElement("div");

      div.className =
        `msg ${
          m.sender === "user"
          ? "me"
          : "them"
        }`;

      div.textContent =
        m.text || "";

      box.appendChild(div);

    });

    box.scrollTop =
      box.scrollHeight;

  });

}

/* =========================================
   SEND MESSAGE
========================================= */

window.sendChat =
async function(){

  if(!currentUID) return;

  const text =
    input.value.trim();

  if(!text) return;

  try{

    await addDoc(
      collection(
        db,
        "supportChats",
        currentUID,
        "messages"
      ),
      {
        text,
        sender:"user",
        createdAt:
        serverTimestamp()
      }
    );

    input.value = "";

  }catch(err){

    console.error(
      "Chat send failed",
      err
    );
  }

};

/* =========================================
   ENTER KEY SEND
========================================= */

if(input){

  input.addEventListener(
    "keypress",
    (e)=>{

      if(e.key === "Enter"){

        sendChat();
      }

    }
  );
}

console.log(
  "💬 MCN Live Support Ready"
);