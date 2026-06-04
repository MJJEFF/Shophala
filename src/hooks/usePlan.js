import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function usePlan(uid) {
    const [plan, setPlan] = useState("free");
    const [loading, setLoading] = useState(true);
    const [expiresAt, setExpiresAt] = useState(null);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }
        const fetchPlan = async () => {
            try {
                const snap = await getDoc(doc(db, "plans", uid));
                if (snap.exists()) {
                    const data = snap.data();
                    const expires = data.expiresAt?.toDate();

                    if (expires && expires < new Date()) {
                        // Plan expired — revert to free
                        setPlan("free");
                    } else {
                        setPlan(data.plan || "free");
                        setExpiresAt(expires);
                    }
                }
            } catch (err) {
                console.error("Plan fetch error:", err);
            }
            setLoading(false);
        };
        fetchPlan();
    }, [uid]);

    return { plan, loading, expiresAt };
}