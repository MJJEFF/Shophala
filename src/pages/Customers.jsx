import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowLeft, Users, ShoppingBag, Phone } from "lucide-react";
import PageLoader from "../components/PageLoader";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/login");

      const snap = await getDocs(
        query(collection(db, "orders"), where("vendorId", "==", u.uid))
      );
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const customerMap = {};
      orders.forEach((o) => {
        if (!o.customerPhone) return;
        const phone = o.customerPhone;
        if (!customerMap[phone]) {
          customerMap[phone] = {
            name: o.customerName || "Unknown",
            phone,
            orders: [],
            totalSpent: 0,
          };
        }
        customerMap[phone].orders.push(o);
        customerMap[phone].totalSpent += o.total || 0;
      });

      setCustomers(
        Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent)
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <PageLoader message="Loading customers..." />;

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center gap-4 px-6 md:px-12 py-5 border-b border-white/10">
        <Link to="/dashboard" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Customers</h1>
        <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">
          {customers.length} total
        </span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        {customers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p>No customers yet.</p>
            <p className="text-sm mt-2">Customers will appear here after they place orders.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {customers.map((c) => (
              <div
                key={c.phone}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <Phone size={12} /> {c.phone}
                    </p>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <ShoppingBag size={12} /> {c.orders.length} order{c.orders.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <p className="text-green-400 font-bold text-lg">
                    ₦{c.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs">total spent</p>
                  <a
                    href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-xl hover:bg-green-500/30 transition font-semibold"
                  >
                    Message on WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
