import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

let currentLink = "";

/* NAV */
window.showPage = (page)=>{
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(page).classList.add("active");
};

/* AUTH MODAL */
window.openAuth = (type)=>{
  alert(type + " modal placeholder (keep simple for now)");
};

/* DASHBOARD CONTROL */
onAuthStateChanged(auth,(user)=>{
  if(user){
    document.getElementById("dashboard").classList.add("active");
  } else {
    document.getElementById("dashboard").classList.remove("active");
  }
});

/* PLATFORM POPUP */
window.openPlatform = (type)=>{
  currentLink = type;

  let text = "";

  if(type==="earn"){
    text = "This platform helps users explore verified earning systems. Read carefully before proceeding.";
  }

  if(type==="float"){
    text = "FixedFloat is an instant crypto exchange used for fast swaps between currencies.";
  }

  document.getElementById("modalText").innerText = text;
  document.getElementById("modal").style.display="block";
};

window.confirmGo = ()=>{
  if(currentLink==="earn") window.open("https://forfans.me/chichiguy","_blank");
  if(currentLink==="float") window.open("https://ff.io/?ref=s1nep47a","_blank");
  closeModal();
};

window.closeModal = ()=>{
  document.getElementById("modal").style.display="none";
};

/* SUPPORT */
window.sendMsg = async ()=>{
  const msg = document.getElementById("msg");

  await addDoc(collection(db,"messages"),{
    text:msg.value,
    time:new Date()
  });

  msg.value="";
  alert("Message sent");
};

/* SETTINGS */
window.changeName = async ()=>{
  const user = auth.currentUser;
  await updateProfile(user,{displayName:document.getElementById("newName").value});
  alert("Updated");
};

window.resetPass = async ()=>{
  const email = auth.currentUser.email;
  await sendPasswordResetEmail(auth,email);
  alert("Reset email sent");
};

/* PORTFOLIO */
window.openPortfolio = ()=>{
  alert("Portfolio gallery coming soon (admin upload system next step)");
};

/* LOGOUT */
window.logout = ()=>signOut(auth);

/* ONLINE USERS (basic simulation ready for upgrade) */
onSnapshot(collection(db,"messages"),(snap)=>{
  document.getElementById("onlineCount").innerText = snap.size;
});
