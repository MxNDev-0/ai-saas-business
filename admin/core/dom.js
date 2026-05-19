// dom.js - MCN SAFE DOM CORE

export function get(id) {
  const el = document.getElementById(id);

  if (!el) {
    console.warn(`⚠ Missing DOM element: ${id}`);

    // optional debug hook
    if (window.logToMonitor) {
      window.logToMonitor(`Missing element: ${id}`, "warn");
    }

    return null;
  }

  return el;
}

/* SAFE VALUE GETTERS */
export function val(id, fallback = "") {
  const el = get(id);
  return el?.value ?? fallback;
}

/* SAFE SET TEXT */
export function setText(id, text = "") {
  const el = get(id);
  if (el) el.textContent = text;
}

/* SAFE HTML */
export function setHTML(id, html = "") {
  const el = get(id);
  if (el) el.innerHTML = html;
}