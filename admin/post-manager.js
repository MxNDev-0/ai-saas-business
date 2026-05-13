/* =========================================
   MCN POST MANAGER MODULE (WITH SEARCH)
========================================= */

const API = "https://mxm-backend.onrender.com/blog";

let postsCache = [];
let filteredPosts = [];

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  injectSearchBox();
  loadPosts();
});

/* ================= SEARCH UI INJECTION ================= */
function injectSearchBox() {
  const container = document.getElementById("postsList");

  const searchHTML = `
    <div style="margin-bottom:10px;">
      <input
        id="postSearch"
        placeholder="🔍 Search posts..."
        style="
          width:100%;
          padding:8px;
          border-radius:8px;
          border:none;
          background:#0b132b;
          color:white;
        "
      />
    </div>
  `;

  container.innerHTML = searchHTML + container.innerHTML;

  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "postSearch") {
      handleSearch(e.target.value);
    }
  });
}

/* ================= LOAD POSTS ================= */
async function loadPosts() {
  try {
    const res = await fetch(`${API}/list`);
    const posts = await res.json();

    postsCache = posts || [];
    filteredPosts = postsCache;

    renderPosts(filteredPosts);

  } catch (err) {
    console.error("Failed to load posts:", err);
    document.getElementById("postsList").innerHTML =
      "<div class='item'>Failed to load posts</div>";
  }
}

/* ================= SEARCH FILTER ================= */
function handleSearch(query) {
  const q = query.toLowerCase().trim();

  if (!q) {
    filteredPosts = postsCache;
  } else {
    filteredPosts = postsCache.filter(p =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.content || "").toLowerCase().includes(q) ||
      (p.id || "").toLowerCase().includes(q)
    );
  }

  renderPosts(filteredPosts);
}

/* ================= RENDER ================= */
function renderPosts(posts) {
  const box = document.getElementById("postsList");

  // keep search box
  const searchBox = box.querySelector("#postSearch");

  box.innerHTML = "";
  if (searchBox) box.appendChild(searchBox.parentElement);

  if (!posts.length) {
    box.innerHTML += "<div class='item'>No posts found</div>";
    return;
  }

  posts.forEach(p => {
    box.innerHTML += `
      <div class="item">

        <b>${p.title}</b>

        <div style="font-size:12px;opacity:0.7;margin:5px 0;">
          ID: ${p.id}
        </div>

        <button onclick="loadIntoEditor('${p.id}')">
          Edit
        </button>

        <button class="danger" onclick="deletePost('${p.id}')">
          Delete
        </button>

      </div>
    `;
  });
}

/* ================= LOAD INTO EDITOR ================= */
window.loadIntoEditor = function (id) {

  const post = postsCache.find(p => p.id === id);

  if (!post) return;

  document.getElementById("editPostId").value = post.id;
  document.getElementById("editTitle").value = post.title || "";
  document.getElementById("editContent").value = post.content || "";

  document.getElementById("e_homepage").checked =
    post.visibility?.homepage || false;

  document.getElementById("e_featured").checked =
    post.visibility?.featured || false;

  document.getElementById("e_trending").checked =
    post.visibility?.trending || false;

  document.getElementById("e_sponsored").checked =
    post.sponsored?.isSponsored || false;

  document.getElementById("e_adPriority").value =
    post.sponsored?.priority || 0;

  document.getElementById("e_adExpiry").value =
    post.sponsored?.expiry || "";

  document.getElementById("e_placeholderSlot").value =
    post.placeholder?.slot || "";

  document.getElementById("e_placeholderText").value =
    post.placeholder?.text || "";
};

/* ================= UPDATE POST ================= */
window.updatePost = async function () {

  const id = document.getElementById("editPostId").value;

  if (!id) return alert("Select a post first");

  const payload = {
    title: document.getElementById("editTitle").value,
    content: document.getElementById("editContent").value,

    visibility: {
      homepage: document.getElementById("e_homepage").checked,
      featured: document.getElementById("e_featured").checked,
      trending: document.getElementById("e_trending").checked
    },

    sponsored: {
      isSponsored: document.getElementById("e_sponsored").checked,
      priority: Number(document.getElementById("e_adPriority").value || 0),
      expiry: document.getElementById("e_adExpiry").value || null
    },

    placeholder: {
      slot: document.getElementById("e_placeholderSlot").value,
      text: document.getElementById("e_placeholderText").value
    }
  };

  try {
    await fetch(`${API}/update/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    alert("Post updated successfully");
    loadPosts();

  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
};

/* ================= DELETE POST ================= */
window.deletePost = async function (id) {

  if (!confirm("Delete this post permanently?")) return;

  try {
    await fetch(`${API}/delete/${id}`, {
      method: "POST"
    });

    alert("Post deleted");
    loadPosts();

  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
};

/* ================= REFRESH ================= */
window.refreshPosts = function () {
  loadPosts();
};