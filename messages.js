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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let chatId = null;
let targetUser = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {

  if (!user) return location.href = "index.html";

  currentUser = user;

  loadInbox();

});

/* ================= CHAT ID ================= */

function id(a,b){
  return [a,b].sort().join("_");
}

/* ================= USER FETCH ================= */

async function getUser(uid) {
  const snap = await getDoc(doc(db,"users",uid));
  return snap.exists() ? snap.data() : { uid, username:"Unknown" };
}

/* ================= OPEN CHAT ================= */

window.openChat = async function(uid){

  chatId = id(currentUser.uid, uid);
  targetUser = await getUser(uid);

  document.getElementById("chatUsername").textContent = targetUser.username;

  document.getElementById("chatScreen").classList.add("active");

  loadMessages();

};

/* ================= SEND MESSAGE ================= */

window.sendMsg = async function(){

  const input = document.getElementById("msgInput");
  const text = input.value.trim();

  if(!text || !chatId) return;

  input.value = "";

  await addDoc(collection(db,"dms",chatId,"messages"),{
    text,
    senderId: currentUser.uid,
    receiverId: targetUser.uid,
    createdAt: serverTimestamp(),
    seen:false
  });

  await setDoc(doc(db,"dms",chatId),{
    members:[currentUser.uid, targetUser.uid],
    lastMessage:text,
    updatedAt:serverTimestamp()
  }, { merge:true });

};

/* ================= LOAD MESSAGES ================= */

function loadMessages(){

  const q = query(collection(db,"dms",chatId,"messages"));

  onSnapshot(q,(snap)=>{

    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(d=>{

      const m = d.data();

      box.innerHTML += `
        <div class="msg ${m.senderId===currentUser.uid?'me':'them'}">
          ${m.text}
        </div>
      `;

    });

    box.scrollTop = box.scrollHeight;

  });

}

/* ================= INBOX (NO DUPLICATES FIX) ================= */

function loadInbox(){

  const q = query(collection(db,"dms"));

  onSnapshot(q,(snap)=>{

    const list = document.getElementById("inboxList");
    list.innerHTML = "";

    const seen = new Set();

    snap.forEach(d=>{

      const chat = d.data();

      if(!chat.members?.includes(currentUser.uid)) return;

      const other = chat.members.find(x=>x!==currentUser.uid);

      const key = id(currentUser.uid, other);
      if(seen.has(key)) return;
      seen.add(key);

      list.innerHTML += `
        <div onclick="openChat('${other}')" class="chat-item">
          Chat
        </div>
      `;

    });

  });

}

/* ================= CLOSE CHAT ================= */

window.closeChat = function(){
  document.getElementById("chatScreen").classList.remove("active");
  chatId = null;
  targetUser = null;
};