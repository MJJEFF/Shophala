import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { email } = req.body;
        // Check if vendor with this email exists in Firestore
        const { getDocs, collection, query, where } = await import("firebase/firestore");
        const snap = await getDocs(
            query(collection(db, "vendors"), where("email", "==", email))
        );
        return res.status(200).json({ exists: !snap.empty });
    } catch (err) {
        return res.status(500).json({ exists: false });
    }
}