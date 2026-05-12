export function goToPost(id) {

  const base = window.location.origin + window.location.pathname.split("/").slice(0, -1).join("/");

  const url = `${base}/post.html?id=${id}`;

  window.location.href = url;

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