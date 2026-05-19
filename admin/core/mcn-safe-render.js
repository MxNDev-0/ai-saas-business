export function safe(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    console.error("SAFE ERROR:", e);
    return fallback;
  }
}

export function mount(id, html) {
  const el = document.getElementById(id);

  if (!el) return false;

  el.innerHTML = html;
  return true;
}

export function safeMount(id, html, fallback = "Loading...") {
  const el = document.getElementById(id);

  if (!el) return;

  try {
    el.innerHTML = html;
  } catch (e) {
    console.error("Mount failed:", e);
    el.innerHTML = fallback;
  }
}