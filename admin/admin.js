import { auth, db } from "./firebase.js";
import { startMonitor } from "./modules/admin-monitor.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= LOG ================= */

function log(msg, type = "ok") {

  const box =
    document.getElementById("monitor");

  if (!box) return;

  const div =
    document.createElement("div");

  div.style.color =
    type === "error"
    ? "red"
    : type === "warn"
    ? "orange"
    : "#00ff88";

  div.textContent =
    `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);

  box.scrollTop =
    box.scrollHeight;
}

/* ================= BOOT MONITOR ================= */

setTimeout(() => {

  log("🧠 MCN Admin Monitor Active");

  log("🔥 Firebase Connected");

  log("📡 Realtime Systems Ready");

  log("💬 Live Chat Ready");

}, 800);

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

  try{

    if(!user){

      location.href =
        "./index.html";

      return;
    }

    const snap =
      await getDoc(
        doc(db,"users",user.uid)
      );

    if(!snap.exists()){

      location.href =
        "./index.html";

      return;
    }

    const data =
      snap.data();

    if(data.role !== "admin"){

      location.href =
        "./dashboard.html";

      return;
    }

    log("✅ Admin online");

    startMonitor();

    loadPosts();
    loadAds();
    loadRejectedAds();

  }catch(err){

    console.error(err);

    log(
      "Auth failed",
      "error"
    );
  }

});

/* ================= AI ================= */

window.generateAI = () => {

  const topic =
    document.getElementById(
      "aiTopic"
    ).value;

  document.getElementById(
    "blogContent"
  ).value =

`AI article about ${topic}

MCN Engine generated article...`;

  log(
    "AI article generated"
  );
};

/* ================= BLOG ================= */

window.createBlog = async()=>{

  try{

    const title =
      document.getElementById(
        "blogTitle"
      ).value;

    const content =
      document.getElementById(
        "blogContent"
      ).value;

    const image =
      document.getElementById(
        "blogImage"
      ).value;

    if(!title || !content){

      alert(
        "Missing fields"
      );

      return;
    }

    await addDoc(
      collection(db,"posts"),
      {
        title,
        content,
        image,
        createdAt:
        serverTimestamp()
      }
    );

    log("✅ Blog created");

  }catch(err){

    console.error(err);

    log(
      "Blog failed",
      "error"
    );
  }

};

/* ================= POSTS ================= */

let allPosts = [];

function loadPosts(){

  const box =
    document.getElementById(
      "postsList"
    );

  const q =
    query(
      collection(db,"posts"),
      orderBy(
        "createdAt",
        "desc"
      )
    );

  onSnapshot(q,(snap)=>{

    allPosts = [];

    box.innerHTML = "";

    snap.forEach(d=>{

      const p = d.data();

      allPosts.push({
        id:d.id,
        ...p
      });

    });

    renderPosts(allPosts);

  });

}

function renderPosts(posts){

  const box =
    document.getElementById(
      "postsList"
    );

  box.innerHTML = "";

  if(posts.length === 0){

    box.innerHTML =
      `<div class="item">
        No posts
      </div>`;

    return;
  }

  posts.forEach(p=>{

    const safeTitle =
      encodeURIComponent(
        p.title || ""
      );

    const safeContent =
      encodeURIComponent(
        p.content || ""
      );

    box.innerHTML += `
      <div class="item">

        <b>
          ${p.title || "Untitled"}
        </b>

        <br>

        <button
          class="small-btn"
          onclick="fillEdit(
            '${p.id}',
            '${safeTitle}',
            '${safeContent}'
          )">

          Edit

        </button>

        <button
          class="small-btn"
          onclick="deletePost('${p.id}')">

          Delete

        </button>

      </div>
    `;
  });

}

window.searchPosts = ()=>{

  const q =
    document.getElementById(
      "searchPosts"
    ).value.toLowerCase();

  const filtered =
    allPosts.filter(p=>

      (p.title || "")
      .toLowerCase()
      .includes(q)

    );

  renderPosts(filtered);

};

/* ================= EDIT ================= */

window.fillEdit = (
  id,
  title,
  content
)=>{

  document.getElementById(
    "editPostId"
  ).value = id;

  document.getElementById(
    "editPostTitle"
  ).value =
    decodeURIComponent(title);

  document.getElementById(
    "editPostContent"
  ).value =
    decodeURIComponent(content);

};

window.updatePost = async()=>{

  try{

    const id =
      document.getElementById(
        "editPostId"
      ).value;

    await updateDoc(
      doc(db,"posts",id),
      {
        title:
        document.getElementById(
          "editPostTitle"
        ).value,

        content:
        document.getElementById(
          "editPostContent"
        ).value
      }
    );

    log("✅ Post updated");

  }catch(err){

    console.error(err);

    log(
      "Update failed",
      "error"
    );
  }

};

window.deletePost = async(id)=>{

  await deleteDoc(
    doc(db,"posts",id)
  );

  log("🗑 Post deleted","warn");

};

/* ================= ADS ================= */

function loadAds(){

  const box =
    document.getElementById(
      "upgradeList"
    );

  onSnapshot(
    collection(db,"adRequests"),
    (snap)=>{

      box.innerHTML = "";

      snap.forEach(d=>{

        const ad =
          d.data();

        box.innerHTML += `
          <div class="item">

            <b>${ad.title}</b>

            <br>

            <button
              class="small-btn"
              onclick="acceptAd('${d.id}')">

              Accept

            </button>

            <button
              class="small-btn"
              onclick="rejectAd('${d.id}')">

              Reject

            </button>

          </div>
        `;
      });
    }
  );

}

window.acceptAd = async(id)=>{

  await updateDoc(
    doc(db,"adRequests",id),
    {
      status:"accepted"
    }
  );

  log("✅ Ad accepted");

};

window.rejectAd = async(id)=>{

  await updateDoc(
    doc(db,"adRequests",id),
    {
      status:"rejected"
    }
  );

  log("❌ Ad rejected");

};

/* ================= REJECTED ================= */

function loadRejectedAds(){

  const box =
    document.getElementById(
      "rejectedList"
    );

  onSnapshot(
    collection(db,"adRequests"),
    (snap)=>{

      box.innerHTML = "";

      snap.forEach(d=>{

        if(
          d.data().status
          === "rejected"
        ){

          box.innerHTML += `
            <div class="item">

              ❌ ${d.data().title}

            </div>
          `;
        }

      });

    }
  );

}

window.clearRejected =
async()=>{

  const snap =
    await getDocs(
      collection(db,"adRequests")
    );

  const batch =
    writeBatch(db);

  snap.forEach(d=>{

    if(
      d.data().status
      === "rejected"
    ){

      batch.delete(d.ref);
    }

  });

  await batch.commit();

  log(
    "Rejected ads cleared"
  );
};

/* ================= NEWS ================= */

window.loadNews = async()=>{

  const box =
    document.getElementById(
      "newsList"
    );

  const keyword =
    document.getElementById(
      "newsKeyword"
    ).value || "technology";

  box.innerHTML =
    `<div class="item">
      Loading...
    </div>`;

  try{

    const res =
      await fetch(
`https://gnews.io/api/v4/search?q=${keyword}&lang=en&max=5&apikey=YOUR_API_KEY`
      );

    const data =
      await res.json();

    box.innerHTML = "";

    if(!data.articles){

      box.innerHTML =
        `<div class="item">
          No news found
        </div>`;

      return;
    }

    data.articles.forEach(a=>{

      box.innerHTML += `
        <div class="item">

          <b>${a.title}</b>

          <br><br>

          <a
            href="${a.url}"
            target="_blank"
            style="color:#5bc0be;">

            Read Article

          </a>

        </div>
      `;
    });

    log("📰 News loaded");

  }catch(err){

    console.error(err);

    log(
      "News failed",
      "error"
    );
  }

};

/* ================= KEEP ALL YOUR ORIGINAL CODE ABOVE ================= */

/* ================= CHAT HOOK (SAFE ADDITION ONLY) ================= */

window.MCN_ADMIN_CHAT_READY = true;

console.log("💬 Admin Chat Hook Active");

/* =========================================
   LIVE SUPPORT ADMIN SYSTEM
========================================= */

let currentSupportUser = null;

/* LOAD USERS */

function loadSupportUsers() {

  const usersBox =
    document.getElementById(
      "supportUsers"
    );

  if (!usersBox) return;

  onSnapshot(
    collection(db, "supportChats"),
    async (snap) => {

      usersBox.innerHTML = "";

      for (const d of snap.docs) {

        const uid = d.id;

        const countSnap =
          await getCountFromServer(
            collection(
              db,
              "supportChats",
              uid,
              "messages"
            )
          );

        const count =
          countSnap.data().count;

        const div =
          document.createElement("div");

        div.className = "item";

        div.style.cursor = "pointer";

        div.innerHTML = `
          👤 ${uid.substring(0,8)}...
          <br>
          💬 ${count} messages
        `;

        div.onclick = () => {

          currentSupportUser = uid;

          loadSupportMessages(uid);

          log(
            "💬 Opened support chat"
          );
        };

        usersBox.appendChild(div);
      }

    }
  );
}

/* LOAD MESSAGES */

function loadSupportMessages(uid) {

  const box =
    document.getElementById(
      "supportMessages"
    );

  if (!box) return;

  const q =
    query(
      collection(
        db,
        "supportChats",
        uid,
        "messages"
      ),
      orderBy("createdAt")
    );

  onSnapshot(q, (snap) => {

    box.innerHTML = "";

    snap.forEach((docSnap) => {

      const m =
        docSnap.data();

      const div =
        document.createElement("div");

      div.className = "item";

      div.style.marginBottom = "8px";

      div.style.background =
        m.sender === "admin"
        ? "#5bc0be"
        : "#16213e";

      div.style.color =
        m.sender === "admin"
        ? "#000"
        : "#fff";

      div.innerHTML = `
        <b>
          ${
            m.sender === "admin"
            ? "ADMIN"
            : "USER"
          }
        </b>

        <br><br>

        ${m.text || ""}
      `;

      box.appendChild(div);

    });

    box.scrollTop =
      box.scrollHeight;

  });
}

/* SEND REPLY */

const sendReplyBtn =
  document.getElementById(
    "sendSupportReply"
  );

if (sendReplyBtn) {

  sendReplyBtn.onclick =
  async () => {

    if (!currentSupportUser) {

      alert(
        "Open a user chat first"
      );

      return;
    }

    const input =
      document.getElementById(
        "supportReply"
      );

    const text =
      input.value.trim();

    if (!text) return;

    try {

      await addDoc(
        collection(
          db,
          "supportChats",
          currentSupportUser,
          "messages"
        ),
        {
          text,
          sender: "admin",
          createdAt:
          serverTimestamp()
        }
      );

      input.value = "";

      log(
        "📤 Support reply sent"
      );

    } catch (err) {

      console.error(err);

      log(
        "Reply failed",
        "error"
      );
    }

  };

}

/* START SUPPORT SYSTEM */

setTimeout(() => {

  loadSupportUsers();

  log(
    "💬 Support inbox online"
  );

}, 1500);