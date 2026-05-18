import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD8Caz-xb3le5VKp4WNssk5jfpgVGKB_xM",
    authDomain: "Wazobuy-baa9d.firebaseapp.com",
    projectId: "Wazobuy-baa9d",
    storageBucket: "Wazobuy-baa9d.firebasestorage.app",
    messagingSenderId: "612657966313",
    appId: "1:612657966313:web:08711a49b68af8c5339478"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);