import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// The platform injects VITE_FIREBASE_CONFIG into the environment for web targets
const metaEnv = (import.meta as any).env;
const firebaseConfig = metaEnv?.VITE_FIREBASE_CONFIG 
  ? JSON.parse(metaEnv.VITE_FIREBASE_CONFIG)
  : firebaseConfigJson;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
