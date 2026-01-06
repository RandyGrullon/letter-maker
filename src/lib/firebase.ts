import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration from environment variables or local config
const getFirebaseConfig = () => {
    // Try environment variables first (for production/Vercel)
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        return {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
    }

    // Fallback to local config file (for local development)
    try {
        const { firebaseConfig } = require('./firebase-config');
        return firebaseConfig;
    } catch (error) {
        console.error('Firebase config not found. Please set environment variables or create firebase-config.ts');
        throw new Error('Firebase configuration is missing');
    }
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
