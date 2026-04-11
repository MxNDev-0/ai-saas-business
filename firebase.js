// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAu8BaL9NV6NU_oKSy-pxh89TuVrovZzaE",
  authDomain: "ai-saas-business-ecfab.firebaseapp.com",
  projectId: "ai-saas-business-ecfab",
  storageBucket: "ai-saas-business-ecfab.firebasestorage.app",
  messagingSenderId: "568523173235",
  appId: "1:568523173235:web:b714d052976268f1e72906"
};

// Initialize
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
