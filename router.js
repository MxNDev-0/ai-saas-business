export function goToPost(id) {
  const base = window.location.origin + window.location.pathname.split("/").slice(0, -1).join("/");
  window.location.href = `${base}/post.html?id=${id}`;
}

export function safeShare(id) {
  const base = window.location.origin + window.location.pathname.split("/").slice(0, -1).join("/");
  const url = `${base}/post.html?id=${id}`;

  if (navigator.share) {
    navigator.share({ url });
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied");
  }
}

/* SOCIAL FEATURES REMOVED:
- profile routing
- messages routing
- notifications routing
*/