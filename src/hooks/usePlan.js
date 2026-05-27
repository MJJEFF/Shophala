import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function usePlan(uid) {
    const [plan, setPlan] = useState("free");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;
        const fetch = async () => {
            try {
                const snap = await getDoc(doc(db, "plans", uid));
                if (snap.exists()) {
                    const data = snap.data();
                    // Check if plan is expired
                    const expires = data.expiresAt?.toDate();
                    if (expires && expires < new Date()) {
                        setPlan("free");
                    } else {
                        setPlan(data.plan || "free");
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetch();
    }, [uid]);

    return { plan, loading };
}