import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= MONITOR ================= */
function log(msg, type = "ok") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error" ? "red" :
    type === "warn" ? "orange" : "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  log("Admin connected");
  loadBlogs();
});

/* ================= LOAD BLOGS (FROM BACKEND) ================= */
async function loadBlogs() {
  const box = document.getElementById("postsList");

  const res = await fetch("https://mxm-backend.onrender.com/blog/list");
  const data = await res.json();

  box.innerHTML = "";

  data.forEach(p => {
    box.innerHTML += `
      <div class="item">
        <b>${p.title}</b><br>

        <button class="small-btn"
          onclick="fillEdit('${p.id}', \`${p.title}\`, \`${p.content}\`)">
          Edit
        </button>
      </div>
    `;
  });

  log("Blogs loaded");
}

/* ================= AUTO FILL ================= */
window.fillEdit = (id, title, content) => {
  editPostId.value = id;
  editPostTitle.value = title;
  editPostContent.value = content;
};

/* ================= UPDATE ================= */
window.updatePost = async () => {
  const id = editPostId.value;

  await fetch(`https://mxm-backend.onrender.com/blog/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: editPostTitle.value,
      content: editPostContent.value
    })
  });

  log("Post updated");
};

/* ================= CREATE ================= */
window.createBlog = async () => {
  await fetch("https://mxm-backend.onrender.com/blog/create", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title: blogTitle.value,
      content: blogContent.value,
      image: blogImage.value
    })
  });

  log("Blog created");
};

/* ================= 🤖 AI GENERATE ================= */
window.generateAI = async () => {
  const topic = prompt("Enter topic");

  const res = await fetch("https://mxm-backend.onrender.com/ai/generate", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ topic })
  });

  const data = await res.json();

  blogTitle.value = data.title;
  blogContent.value = data.content;

  log("AI content generated");
};

/* ================= ⏳ SCHEDULE ================= */
window.schedulePost = async () => {
  const date = prompt("Enter date (YYYY-MM-DD HH:MM)");

  await fetch("https://mxm-backend.onrender.com/blog/schedule", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title: blogTitle.value,
      content: blogContent.value,
      image: blogImage.value,
      publishAt: date
    })
  });

  log("Post scheduled", "warn");
};