export function get(id) {
  const el = document.getElementById(id);

  if (!el) {
    console.warn(`⚠ Missing DOM element: ${id}`);
  }

  return el;
}