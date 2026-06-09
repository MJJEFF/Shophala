import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowLeft, ShoppingBag, Clock, Check, X, Package } from "lucide-react";
import PageLoader from "../components/PageLoader";

const STATUS_STYLES = {
  new: "bg-blue-500/20 text-blue-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const STATUS_ICONS = {
  new: <Package size={14} />,
  pending: <Clock size={14} />,
  completed: <Check size={14} />,
  cancelled: <X size={14} />,
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/login");
      const snap = await getDocs(
        query(collection(db, "orders"), where("vendorId", "==", u.uid))
      );
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => (o.status || "new") === filter);

  const counts = {
    all: orders.length,
    new: orders.filter((o) => !o.status || o.status === "new").length,
    pending: orders.filter((o) => o.status === "pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (loading) return <PageLoader message="Loading orders..." />;

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center gap-4 px-6 md:px-12 py-5 border-b border-white/10">
        <Link to="/dashboard" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Orders</h1>
        <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">
          {orders.length} total
        </span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        <div className="flex gap-2 flex-wrap mb-8">
          {["all", "new", "pending", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition flex items-center gap-1.5 ${
                filter === status
                  ? "bg-white text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {status} ({counts[status]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
            <p>No {filter !== "all" ? filter : ""} orders yet.</p>
            {filter === "all" && (
              <p className="text-sm mt-2">Share your store link to start receiving orders!</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((o) => (
              <div key={o.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {o.customerName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold">{o.customerName || "Unknown"}</p>
                        <p className="text-gray-400 text-xs">{o.customerPhone}</p>
                      </div>
                    </div>

                    {o.items && o.items.length > 0 && (
                      <div className="bg-black/30 rounded-xl p-3 mb-3">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-gray-300">{item.name} × {item.qty}</span>
                            <span className="text-white font-semibold">
                              ₦{(item.price * item.qty).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {o.address && (
                          <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-white/10">
                            📍 {o.address}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-green-400 font-bold text-lg">
                      ₦{o.total?.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full w-fit ${STATUS_STYLES[o.status || "new"]}`}>
                      {STATUS_ICONS[o.status || "new"]}
                      {o.status || "new"}
                    </span>

                    <select
                      value={o.status || "new"}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30 transition cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <a
                      href={`https://wa.me/${o.customerPhone?.replace(/\D/g, "").replace(/^0/, "234")}?text=${encodeURIComponent(`Hi ${o.customerName}, your order has been ${o.status === "completed" ? "completed ✅" : "received"} by ${o.vendorStoreName || "our store"}. Thank you for shopping with us!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-green-500/30 transition"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Reply on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
