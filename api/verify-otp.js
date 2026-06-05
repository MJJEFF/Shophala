import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
};

function getDb() {
    const app = getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApp();
    return getFirestore(app);
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, message: "Email and code required" });
        }

        const db = getDb();
        const otpRef = doc(db, "otpCodes", email);
        const snap = await getDoc(otpRef);

        if (!snap.exists()) {
            return res.status(400).json({ success: false, message: "Code not found. Please request a new one." });
        }

        const data = snap.data();

        if (data.attempts >= 5) {
            await deleteDoc(otpRef);
            return res.status(400).json({ success: false, message: "Too many attempts. Please request a new code." });
        }

        if (Date.now() > data.expiresAt) {
            await deleteDoc(otpRef);
            return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
        }

        if (data.code !== code) {
            await updateDoc(otpRef, { attempts: increment(1) });
            return res.status(400).json({ success: false, message: "Wrong code. Please try again." });
        }

        await deleteDoc(otpRef);
        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Verify OTP error:", err);
        return res.status(500).json({ success: false, message: "Verification failed. Please try again." });
    }
}