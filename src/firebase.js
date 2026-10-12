import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBbTWQsatj2qOtzMjMHBvnpnEfW1o_2CgQ",
  authDomain: "our-journey-a030a.firebaseapp.com",
  projectId: "our-journey-a030a",
  storageBucket: "our-journey-a030a.firebasestorage.app",
  messagingSenderId: "332364306377",
  appId: "1:332364306377:web:34c0fb368a6d20d9f63a18",
  measurementId: "G-8G3SZVVZTJ"
};

// เริ่มต้นใช้งาน Firebase Services เฉพาะ Auth และ Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);