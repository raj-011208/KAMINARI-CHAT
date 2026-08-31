/**
 * Kaminari Chat - Firebase Integration & Initialization
 * Automatically loads from injected firebase-applet-config.json or environment variables.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseAppletConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: firebaseAppletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: firebaseAppletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: firebaseAppletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: firebaseAppletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: firebaseAppletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'MY_FIREBASE_PROJECT_ID'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Support custom named database if present
    const dbId = (firebaseAppletConfig as any).firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;
    if (dbId && dbId !== '(default)') {
      db = getFirestore(app, dbId);
    } else {
      db = getFirestore(app);
    }
    storage = getStorage(app);
    console.log('⚡ Kaminari Chat: Live Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('⚠️ Kaminari Chat: Firebase live init failed, switching to local state engine:', error);
  }
} else {
  console.info('⚡ Kaminari Chat: Running in High-Speed Local Simulation Mode.');
}

export { app, auth, db, storage, firebaseConfig };
export default app;
