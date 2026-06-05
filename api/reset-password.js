import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
    if (getApps().length > 0) return getApp();
    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
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
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ success: false, error: "Email and password required" });
        }

        const adminApp = getAdminApp();
        const adminAuth = getAuth(adminApp);

        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.updateUser(user.uid, { password: newPassword });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Reset password error:", err);
        if (err.code === "auth/user-not-found") {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        return res.status(500).json({ success: false, error: err.message });
    }
}