import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC9KUGFYrmbDl1qPTsOjsBXkytJ7Pfhqfs",
  authDomain: "sentimentscope-a6714.firebaseapp.com",
  projectId: "sentimentscope-a6714",
  storageBucket: "sentimentscope-a6714.firebasestorage.app",
  messagingSenderId: "188551643830",
  appId: "1:188551643830:web:ce7e0ea793d63923839c17",
  measurementId: "G-J8595DBXKY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
};