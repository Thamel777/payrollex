import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyAfvzR24EE3-GeMDEfR42BGuaFLaA-1CCw",
  authDomain: "payrollex-6ddfd.firebaseapp.com",
  projectId: "payrollex-6ddfd",
  storageBucket: "payrollex-6ddfd.firebasestorage.app",
  messagingSenderId: "189114603137",
  appId: "1:189114603137:web:1811f994078ae5ccdd1f80",
  measurementId: "G-LR76NK3SHS"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
