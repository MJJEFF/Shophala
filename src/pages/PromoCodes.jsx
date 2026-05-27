import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowLeft, Plus, Trash2, Tag } from "lucide-react";

export default function PromoCodes() {
    const [user, setUser] = useState(null);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ code: "", discount: "", type: "percent" });
    const [adding, setAdding] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return navigate("/login");
            setUser(u);
            const snap = await getDocs(
                query(collection(db, "promoCodes"), where("vendorId", "==", u.uid))
            );
            setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsub;
    }, []);

    const handleAdd = async () => {
        if (!form.code || !form.discount) return;
        setAdding(true);
        const newCode = {
            code: form.code.toUpperCase().trim(),
            discount: Number(form.discount),
            type: form.type,
            vendorId: user.uid,
            usageCount: 0,
            createdAt: new Date(),
        };
        const ref = await addDoc(collection(db, "promoCodes"), newCode);
        setCodes(prev => [...prev, { id: ref.id, ...newCode }]);
        setForm({ code: "", discount: "", type: "percent" });
        setAdding(false);
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this promo code?")) return;
        await deleteDoc(doc(db, "promoCodes", id));
        setCodes(prev => prev.filter(c => c.id !== id));
    };

    if (loading)
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="flex items-center gap-4 px-6 md:px-12 py-5 border-b border-white/10">
                <Link to="/dashboard" className="text-gray-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">Promo Codes</h1>
            </nav>

            <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">

                {/* Add Code Form */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                    <h3 className="font-bold text-lg mb-4">Create Promo Code</h3>
                    <div className="flex flex-col gap-4">
                        <input
                            placeholder="Code (e.g. SAVE20)"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                placeholder="Discount amount"
                                value={form.discount}
                                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                            />
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-white/30 transition"
                            >
                                <option value="percent">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₦)</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={adding || !form.code || !form.discount}
                            className="bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            {adding ? "Creating..." : "Create Code"}
                        </button>
                    </div>
                </div>

                {/* Codes List */}
                <h3 className="font-bold text-lg mb-4">Your Promo Codes</h3>
                {codes.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Tag size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No promo codes yet. Create one above!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {codes.map((c) => (
                            <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-mono font-bold text-green-400 text-lg">{c.code}</span>
                                        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-400">
                                            {c.type === "percent" ? `${c.discount}% off` : `₦${c.discount} off`}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm">Used {c.usageCount} times</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="text-red-400 hover:text-red-300 transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}