import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 apiKey: "AIzaSyCK-warbMazOr3WFSbNEXiCQhy92G_Mpk4",
  authDomain: "bakbazar-4f9b4.firebaseapp.com",
  projectId: "bakbazar-4f9b4",
  storageBucket: "bakbazar-4f9b4.firebasestorage.app",
  messagingSenderId: "27218414226",
  appId: "1:27218414226:web:7e72460fe586685b49b44b",
  measurementId: "G-62KFWXLT2W"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();