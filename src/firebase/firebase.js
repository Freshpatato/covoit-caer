import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDva4xNmPhOmPow1eC4jpYYZRskWIGp5B4",
  authDomain: "covoit-5e22e.firebaseapp.com",
  projectId: "covoit-5e22e",
  storageBucket: "covoit-5e22e.firebasestorage.app",
  messagingSenderId: "264721497119",
  appId: "1:264721497119:web:c2e3864674e34ea347a92a",
  measurementId: "G-DFQKDB6917",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const createUser = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInUser = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Nouvelle fonction pour enregistrer les infos supplémentaires
export const saveUserData = async (uid, data) => {
  await setDoc(doc(db, "users", uid), data);
};
