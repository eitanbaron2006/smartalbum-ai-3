
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// TODO: Replace with your specific Firebase project configuration
// You can find these in the Firebase Console -> Project Settings -> General
const firebaseConfig = {
    apiKey: "AIzaSyDw2wte5G5FH0UmB2G1r7eTT3rRNjVrqnQ",
    authDomain: "smartalbumai-ae610.firebaseapp.com",
    projectId: "smartalbumai-ae610",
    storageBucket: "smartalbumai-ae610.firebasestorage.app",
    messagingSenderId: "783210133528",
    appId: "1:783210133528:web:b193615dad52b0de52eb6d",
    measurementId: "G-E56MZJ6B79"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);