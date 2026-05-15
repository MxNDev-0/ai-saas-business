import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================
   MCN AI ENGINE v2 (ADMIN CORE)
   - Blog Generator
   - SEO Engine
   - Monetization Hooks
   - Scheduler Ready
========================================= */

let AI_PROVIDER = "mock"; // change to "openai" or "gemini" later

/* =========================================
   LOG HELPER (safe fallback)
========================================= */

function log(msg, type = "ok") {
  if (window.log) {
    window.log(msg, type);
  } else {
    console.log(`[MCN AI] ${msg}`);
  }
}

/* =========================================
   1. CORE AI GENERATOR
========================================= */

export async function generateAI(topic) {

  log("🤖 AI generating content...");

  // 🔥 MOCK AI (safe fallback)
  if (AI_PROVIDER === "mock") {

    return `
# ${topic}

## Introduction
This article explores ${topic} in a structured and informative way.

## Main Points
- Key insight about ${topic}
- Important details and analysis
- Practical applications

## Conclusion
This is an AI-generated article about ${topic}.
    `.trim();
  }

  // 🔥 PLACEHOLDER FOR REAL AI
  // OpenAI / Gemini integration goes here later
  return "AI provider not configured.";
}

/* =========================================
   2. SEO ENGINE
========================================= */

export function generateSEO(title, content) {

  const keywords = title
    .toLowerCase()
    .split(" ")
    .slice(0, 6)
    .join(", ");

  return {
    seoTitle: title,
    seoDescription: content.slice(0, 160),
    keywords
  };
}

/* =========================================
   3. MONETIZATION ENGINE (AFFILIATE HOOKS)
========================================= */

export function injectAffiliateLinks(content) {

  const affiliateMap = {
    "hosting": "https://your-affiliate-link.com/hosting",
    "ai": "https://your-affiliate-link.com/ai-tools",
    "crypto": "https://your-affiliate-link.com/crypto",
    "marketing": "https://your-affiliate-link.com/marketing"
  };

  let updated = content;

  Object.keys(affiliateMap).forEach(key => {
    if (updated.toLowerCase().includes(key)) {
      updated += `\n\n👉 Recommended Resource: ${affiliateMap[key]}`;
    }
  });

  return updated;
}

/* =========================================
   4. BLOG BUILDER (FULL PIPELINE)
========================================= */

export async function buildAIArticle(topic) {

  let content = await generateAI(topic);

  const seo = generateSEO(topic, content);

  content = injectAffiliateLinks(content);

  return {
    title: topic,
    content,
    seo,
    createdAt: serverTimestamp(),
    aiGenerated: true,
    autopilot: false
  };
}

/* =========================================
   5. PUBLISH TO FIRESTORE
========================================= */

export async function publishAIArticle(topic) {

  try {

    const article = await buildAIArticle(topic);

    await addDoc(collection(db, "posts"), article);

    log("🚀 AI article published: " + topic);

    return article;

  } catch (err) {

    console.error(err);
    log("❌ AI publish failed", "error");

    return null;
  }
}

/* =========================================
   6. AUTOPILOT MODE (OPTIONAL)
========================================= */

export async function autopilotPost(topic) {

  log("🤖 AUTOPILOT running...");

  return await publishAIArticle(topic);
}

/* =========================================
   7. SWITCH AI PROVIDER
========================================= */

export function setAIProvider(provider) {
  AI_PROVIDER = provider;
  log("⚙ AI Provider set to: " + provider);
}