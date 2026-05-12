import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let chatId = null;
let targetUid = null;

onAuthStateChanged(auth, (user) => {
  if (!user) return (location.href = "index.html");

  currentUser = user;

  const params = new URLSearchParams(location.search);
  targetUid = params.get("uid");

  loadInbox();

  if (targetUid) openChat(targetUid);
});

function createChatId(a,b){
  return [a,b].sort().join("_");
}

/* ================= OPEN CHAT ================= */

window.openChat = async function(uid){

  targetUid = uid;
  chatId = createChatId(currentUser.uid, uid);

  const userSnap = await getDoc(doc(db,"users",uid));
  const u = userSnap.data();

  document.getElementById("chatUsername").textContent = u.username;
  document.getElementById("chatAvatar").src = u.photo || "";

  loadMessages();

};

/* ================= SEND ================= */

window.sendMsg = async function(){

  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if(!text) return;

  input.value = "";

  await addDoc(collection(db,"dms",chatId,"messages"),{
    text,
    senderId: currentUser.uid,
    receiverId: targetUid,
    createdAt: serverTimestamp(),
    seen:false
  });

  await updateDoc(doc(db,"dms",chatId),{
    lastMessage:text,
    updatedAt:serverTimestamp(),
    [`unread.${targetUid}`]: increment(1)
  });

};

/* ================= LOAD MESSAGES ================= */

function loadMessages(){

  const q = query(
    collection(db,"dms",chatId,"messages"),
    orderBy("createdAt")
  );

  onSnapshot(q,(snap)=>{

    const box = document.getElementById("chatBox");
    box.innerHTML="";

    snap.forEach(d=>{

      const m = d.data();

      box.innerHTML += `
        <div style="margin:5px;padding:8px;background:${m.senderId===currentUser.uid?"#5bc0be":"#16213e"};color:${m.senderId===currentUser.uid?"black":"white"};border-radius:10px;">
          ${m.text}
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;

  });

}

/* ================= INBOX ================= */

function loadInbox(){

  const q = query(collection(db,"dms"));

  onSnapshot(q,(snap)=>{

    const list = document.getElementById("inboxList");
    list.innerHTML="";

    snap.forEach(d=>{

      const chat = d.data();
      if(!chat.members?.includes(currentUser.uid)) return;

      const other = chat.members.find(x=>x!==currentUser.uid);

      list.innerHTML += `
        <div onclick="openChat('${other}')" style="padding:10px;background:#16213e;margin:5px;border-radius:10px;">
          Chat
        </div>
      `;

    });

  });

}