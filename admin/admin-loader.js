import { startAdminEngine } from "./admin.js";

window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 SINGLE BOOT START");

  await startAdminEngine();

  console.log("✅ ENGINE READY");
});