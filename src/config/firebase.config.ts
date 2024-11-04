import { FirebaseOptions } from 'firebase/app';

const currentDomain = window.location.hostname;
const isProduction = currentDomain === 'whatcanicookai.netlify.app';
const authDomain = isProduction 
  ? currentDomain 
  : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;

export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};