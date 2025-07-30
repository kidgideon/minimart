// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD4C2jCZaUxGNYAg7lBNQgbwHaOvoZeTgs",
  authDomain: "minimart-web.firebaseapp.com",
  projectId: "minimart-web",
  storageBucket: "minimart-web.appspot.com",  
  messagingSenderId: "424108494420",
  appId: "1:424108494420:web:2aac33a63aa0b1013fa7c1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
