import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAuhUQaLWMOxap4NrLWEyf-TduLYsAP5lU",
  authDomain: "myday-12c3a.firebaseapp.com",
  projectId: "myday-12c3a",
  storageBucket: "myday-12c3a.firebasestorage.app",
  messagingSenderId: "425452536354",
  appId: "1:425452536354:web:9285561828bfe97fd3407b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID specified in firebase-applet-config.json
export const db = initializeFirestore(app, {}, "ai-studio-myday-188b62bf-285f-4eb0-bf12-a21bd831c6de");

// Initialize Auth
export const auth = getAuth(app);
