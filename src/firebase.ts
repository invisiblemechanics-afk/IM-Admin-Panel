import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-xfzgchsvlF6_cyAvHXNUP4u6XpUpCbw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "invisible-mechanics---2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "invisible-mechanics---2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "invisible-mechanics---2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1087911820316",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1087911820316:web:469b8a189be2c005cc33d9"
};

let app;
let db;
let storage;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  
  console.log('Firebase initialized successfully');
  console.log('Firebase config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
  
  // Use production Firestore - no emulator
  console.log('Using production Firestore database');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create mock objects for development
  db = null as any;
  storage = null as any;
  auth = null as any;
}

// Network optimization functions
export const enableFirestoreNetwork = () => enableNetwork(db);
export const disableFirestoreNetwork = () => disableNetwork(db);

export { db, storage, auth };