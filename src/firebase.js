import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD8Caz-xb3le5VKp4WNssk5jfpgVGKB_xM",
    authDomain: "Shophala-baa9d.firebaseapp.com",
    projectId: "Shophala-baa9d",
    storageBucket: "Shophala-baa9d.firebasestorage.app",
    messagingSenderId: "612657966313",
    appId: "1:612657966313:web:08711a49b68af8c5339478"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Keep user logged in even after browser refresh
setPersistence(auth, browserLocalPersistence);