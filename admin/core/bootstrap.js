export function bootstrapMCN() {

  console.log("🚀 Bootstrap starting...");

  try { initPosts(); }
  catch(e){ console.error("Posts failed", e); }

  try { initAds(); }
  catch(e){ console.error("Ads failed", e); }

  try { initSupport(); }
  catch(e){ console.error("Support failed", e); }

  console.log("✅ Bootstrap complete");
}