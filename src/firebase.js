import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASet23t9I_XNWCbxkrV6Rry21Wnuf6DtE",
  authDomain: "davi-celulares.firebaseapp.com",
  projectId: "davi-celulares",
  storageBucket: "davi-celulares.firebasestorage.app",
  messagingSenderId: "304676030931",
  appId: "1:304676030931:web:d5947e7319699c9a80c726",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);