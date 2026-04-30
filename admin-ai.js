import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   MCN ENGINE AI LAYER v1
   - Auto Blogger
   - Scheduler
   - Security Monitor
   - System Intelligence Logs
================================== */

let systemStatus = {
  spamDetected: 0,
  errors: 0,
  warnings: 0
};

/* ===============================
   1. AUTO BLOG WRITER (SIMULATED AI)
================================== */
export async function generateBlogPost(topic) {
  // Placeholder AI logic (can later connect OpenAI API)
  const post = {
    title: `AI: ${topic}`,
    content: `This is an AI-generated article about ${topic}. The system can later be connected to GPT API for full automation.`,
    category: "AI Generated",
    createdAt: serverTimestamp(),
    featured: false
  };

  await addDoc(collection(db, "posts"), post);

  logEvent("AI_BLOG_CREATED", `Post generated: ${topic}`, "info");

  return post;
}

/* ===============================
   2. SCHEDULER SYSTEM
================================== */
export async function schedulePost(title, content, time) {
  await addDoc(collection(db, "scheduledPosts"), {
    title,
    content,
    scheduledTime: time,
    status: "pending",
    createdAt: serverTimestamp()
  });

  logEvent("POST_SCHEDULED", title, "info");
}

/* ===============================
   AUTO EXECUTOR (RUN EVERY 10s)
================================== */
setInterval(async () => {
  const q = query(collection(db, "scheduledPosts"), orderBy("createdAt", "asc"));

  onSnapshot(q, (snap) => {
    snap.forEach(async (docSnap) => {
      const data = docSnap.data();

      if (data.status === "done") return;

      const now = new Date().getTime();
      const scheduled = new Date(data.scheduledTime).getTime();

      if (now >= scheduled) {
        await addDoc(collection(db, "posts"), {
          title: data.title,
          content: data.content,
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "scheduledPosts", docSnap.id), {
          ...data,
          status: "done"
        });

        logEvent("AUTO_POST_PUBLISHED", data.title, "success");
      }
    });
  });
}, 10000);

/* ===============================
   3. SECURITY MONITOR ENGINE
================================== */
export function startSecurityMonitor() {
  const eventsRef = collection(db, "events");

  onSnapshot(eventsRef, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        const e = change.doc.data();

        // SIMPLE THREAT DETECTION
        if (typeof e.text === "string") {
          if (e.text.includes("hack") || e.text.includes("inject")) {
            systemStatus.spamDetected++;

            logEvent(
              "SECURITY_ALERT",
              "Suspicious activity detected",
              "danger"
            );
          }

          if (e.text.length > 500) {
            systemStatus.warnings++;

            logEvent(
              "LARGE_PAYLOAD",
              "Possible spam message detected",
              "warning"
            );
          }
        }
      }
    });
  });
}

/* ===============================
   4. LOGGING SYSTEM (TO ADMIN MONITOR)
================================== */
export async function logEvent(type, message, level = "info") {
  await addDoc(collection(db, "events"), {
    type,
    text: `[${level.toUpperCase()}] ${message}`,
    createdAt: serverTimestamp()
  });
}

/* ===============================
   5. SYSTEM HEALTH CHECK
================================== */
export async function systemHealthCheck() {
  const status = {
    status: "OK",
    spam: systemStatus.spamDetected,
    warnings: systemStatus.warnings,
    errors: systemStatus.errors
  };

  await logEvent("HEALTH_CHECK", JSON.stringify(status), "info");

  return status;
}

/* ===============================
   6. AUTO START SYSTEM
================================== */
startSecurityMonitor();