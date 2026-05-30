import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import PageLoader from "../components/PageLoader";
import { ArrowLeft, TrendingUp, ShoppingBag, Users, Package } from "lucide-react";
import usePlan from "../hooks/usePlan";

export default function Analytics() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return navigate("/login");
            setUser(u);

            const [orderSnap, productSnap] = await Promise.all([
                getDocs(query(collection(db, "orders"), where("vendorId", "==", u.uid))),
                getDocs(query(collection(db, "products"), where("vendorId", "==", u.uid))),
            ]);

            setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setProducts(productSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsub;
    }, []);

    const { plan } = usePlan(user?.uid);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const uniqueCustomers = [...new Set(orders.map(o => o.customerPhone))].length;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Top products by order frequency
    const productOrderCount = {};
    orders.forEach(o => {
        o.items?.forEach(item => {
            productOrderCount[item.name] = (productOrderCount[item.name] || 0) + item.qty;
        });
    });
    const topProducts = Object.entries(productOrderCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (loading) return <PageLoader message="Loading analytics..." />;

    if (plan === "free")
        return (
            <div className="min-h-screen bg-black text-white">
                <nav className="flex items-center gap-4 px-6 md:px-12 py-5 border-b border-white/10">
                    <Link to="/dashboard" className="text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Analytics</h1>
                </nav>
                <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
                    <TrendingUp size={64} className="text-gray-700 mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Analytics is a Pro feature</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Upgrade to Pro to see detailed sales analytics, top products, customer insights and more.
                    </p>
                    <Link to="/pricing">
                        <button className="bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition">
                            Upgrade to Pro ⚡
                        </button>
                    </Link>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="flex items-center gap-4 px-6 md:px-12 py-5 border-b border-white/10">
                <Link to="/dashboard" className="text-gray-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">Analytics</h1>
            </nav>

            <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={20} />, color: "text-green-400" },
                        { label: "Total Orders", value: orders.length, icon: <ShoppingBag size={20} />, color: "text-blue-400" },
                        { label: "Customers", value: uniqueCustomers, icon: <Users size={20} />, color: "text-purple-400" },
                        { label: "Avg Order", value: `₦${Math.round(avgOrderValue).toLocaleString()}`, icon: <Package size={20} />, color: "text-yellow-400" },
                    ].map((s) => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className={`flex items-center gap-2 mb-3 text-sm ${s.color}`}>
                                {s.icon} {s.label}
                            </div>
                            <p className="text-2xl font-bold">{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-6">Top Products</h3>
                        {topProducts.length === 0 ? (
                            <p className="text-gray-500">No orders yet.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {topProducts.map(([name, count], i) => (
                                    <div key={name}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-300">{name}</span>
                                            <span className="text-sm font-bold">{count} sold</span>
                                        </div>
                                        <div className="bg-white/10 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${(count / topProducts[0][1]) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-6">Recent Orders</h3>
                        {orders.length === 0 ? (
                            <p className="text-gray-500">No orders yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {orders.slice(0, 6).map((o) => (
                                    <div key={o.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-sm font-semibold">{o.customerName}</p>
                                            <p className="text-xs text-gray-500">{o.items?.length} item(s)</p>
                                        </div>
                                        <p className="text-green-400 font-bold text-sm">
                                            ₦{o.total?.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}