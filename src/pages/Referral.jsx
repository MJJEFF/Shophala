import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, getDocs, collection, query, where, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Copy, Check, Gift, Users, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import PageLoader from "../components/PageLoader";

export default function Referral() {
    const [user, setUser] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return navigate("/login");
            setUser(u);

            const vendorDoc = await getDoc(doc(db, "vendors", u.uid));
            if (vendorDoc.exists()) {
                const data = vendorDoc.data();
                setVendor(data);

                // Fetch referrals
                const refSnap = await getDocs(
                    query(collection(db, "vendors"), where("referredBy", "==", u.uid))
                );
                const refs = refSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setReferrals(refs);

                // Auto-grant Pro if 3+ referrals and not already rewarded
                if (refs.length >= 3 && !data.referralRewarded) {
                    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    await setDoc(doc(db, "plans", u.uid), {
                        plan: "pro",
                        reference: "referral_reward",
                        email: u.email,
                        amount: 0,
                        yearly: false,
                        activatedAt: new Date(),
                        expiresAt,
                    });
                    await updateDoc(doc(db, "vendors", u.uid), {
                        referralRewarded: true,
                    });
                    alert("🎉 Congratulations! You've earned 1 month Pro free!");
                }
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const referralLink = `${window.location.origin}/login?ref=${user?.uid}`;

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsApp = () => {
        const message = `Hey! I've been using Shophala to manage my WhatsApp store and it's amazing 🔥

Create your own free store in 2 minutes 👇
${referralLink}

You get a free store, and I get a bonus for referring you 🎁`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    };

    const rewardEarned = referrals.length >= 3;
    const progress = Math.min(referrals.length, 3);

    if (loading) return <PageLoader message="Loading referrals..." />;

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
                <Link to="/dashboard">
                    <Logo size={32} />
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
                    <ArrowLeft size={16} /> Dashboard
                </Link>
            </nav>

            <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift size={32} className="text-green-400" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3">Refer & Earn</h1>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Refer 3 vendors to Shophala and get <span className="text-green-400 font-semibold">1 month Pro free</span>. No limits — keep referring, keep earning!
                    </p>
                </div>

                {/* Progress */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold">Your Progress</p>
                        <span className="text-green-400 font-bold">{progress}/3 referrals</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-3 mb-3">
                        <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(progress / 3) * 100}%` }}
                        />
                    </div>
                    {rewardEarned ? (
                        <p className="text-green-400 text-sm font-semibold">
                            🎉 You've earned 1 month Pro free! Contact us on WhatsApp to claim.
                        </p>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            {3 - progress} more referral{3 - progress !== 1 ? "s" : ""} to unlock 1 month Pro free
                        </p>
                    )}
                </div>

                {/* Referral Link */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <p className="text-gray-400 text-sm mb-3">Your referral link</p>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 truncate">
                            {referralLink}
                        </div>
                        <button
                            onClick={copyLink}
                            className="bg-white text-black px-4 py-3 rounded-xl font-semibold text-sm hover:scale-105 transition flex items-center gap-2 flex-shrink-0"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>

                {/* Share on WhatsApp */}
                <button
                    onClick={shareOnWhatsApp}
                    className="w-full bg-green-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition mb-10"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share on WhatsApp
                </button>

                {/* How it works */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                    <h3 className="font-bold text-lg mb-4">How it works</h3>
                    <div className="flex flex-col gap-4">
                        {[
                            { step: "1", text: "Copy your referral link above" },
                            { step: "2", text: "Share it with vendors you know on WhatsApp, Instagram or anywhere" },
                            { step: "3", text: "When they sign up using your link, they count as your referral" },
                            { step: "4", text: "Get 3 referrals and claim 1 month Pro free!" },
                        ].map((s) => (
                            <div key={s.step} className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {s.step}
                                </div>
                                <p className="text-gray-300 text-sm">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Referrals list */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-gray-400" />
                        <h3 className="font-bold text-lg">Your Referrals ({referrals.length})</h3>
                    </div>
                    {referrals.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users size={48} className="mx-auto mb-3 opacity-30" />
                            <p>No referrals yet. Share your link to get started!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {referrals.map((r) => (
                                <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{r.name}</p>
                                        <p className="text-gray-500 text-xs">{r.storeName}</p>
                                    </div>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                                        Signed up ✓
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}