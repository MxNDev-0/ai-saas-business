import { initPosts } from "./modules/posts.js";

window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 MCN SINGLE CORE BOOT START");

  const monitor = document.getElementById("monitor");

  function log(msg) {
    console.log(msg);
    if (monitor) {
      monitor.innerHTML += `<div>${msg}</div>`;
    }
  }

  try {
    log("🧠 Starting engine...");

    await initPosts();

    log("✅ Posts loaded");

    log("🚀 ADMIN READY");
  } catch (e) {
    console.error(e);
    log("❌ BOOT ERROR: " + e.message);
  }
});