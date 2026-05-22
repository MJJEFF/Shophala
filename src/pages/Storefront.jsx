import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { ShoppingCart, Plus, Minus, X, MessageCircle, Store } from "lucide-react";

export default function Storefront() {
    const { vendor } = useParams();
    const [vendorData, setVendorData] = useState(null);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [customerForm, setCustomerForm] = useState({
        name: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        const fetchStore = async () => {
            try {
                // Fetch vendor directly by ID (much faster)
                const { getDoc, doc } = await import("firebase/firestore");
                const vendorDoc = await getDoc(doc(db, "vendors", vendor));

                if (!vendorDoc.exists()) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                setVendorData(vendorDoc.data());

                // Fetch products
                const productSnap = await getDocs(
                    query(collection(db, "products"), where("vendorId", "==", vendor))
                );
                setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Storefront load error:", err);
                setNotFound(true);
            }
            setLoading(false);
        };
        fetchStore();
    }, [vendor]);

    const addToCart = (product) => {
        setCart((prev) => {
            const exists = prev.find((i) => i.id === product.id);
            if (exists)
                return prev.map((i) =>
                    i.id === product.id ? { ...i, qty: i.qty + 1 } : i
                );
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((i) => i.id !== id));
    };

    const updateQty = (id, delta) => {
        setCart((prev) =>
            prev
                .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
                .filter((i) => i.qty > 0)
        );
    };

    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

    const handleWhatsAppCheckout = () => {
        if (!customerForm.name || !customerForm.phone) return;

        const itemsList = cart
            .map((i) => `• ${i.name} x${i.qty} — ₦${(i.price * i.qty).toLocaleString()}`)
            .join("\n");

        const message = `Hello! I'd like to place an order from your Shophala store 🛍️

*Customer Details:*
Name: ${customerForm.name}
Phone: ${customerForm.phone}
${customerForm.address ? `Address: ${customerForm.address}` : ""}

*Order Summary:*
${itemsList}

*Total: ₦${cartTotal.toLocaleString()}*

Please confirm my order. Thank you!`;

        const whatsappNumber = vendorData.phone.replace(/\D/g, "");
        const intlNumber = whatsappNumber.startsWith("0")
            ? "234" + whatsappNumber.slice(1)
            : whatsappNumber;

        window.open(
            `https://wa.me/${intlNumber}?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    };

    if (loading)
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-gray-400 animate-pulse text-xl">Loading store...</p>
            </div>
        );

    if (notFound)
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <Store size={64} className="text-gray-600" />
                <h1 className="text-3xl font-bold">Store not found</h1>
                <p className="text-gray-400">This store link is invalid or has been removed.</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Store Header */}
            <div className="border-b border-white/10 px-6 md:px-12 py-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{vendorData?.storeName}</h1>
                    <p className="text-gray-400 text-sm mt-1">Powered by Shophala</p>
                </div>
                <button
                    onClick={() => setShowCart(true)}
                    className="relative flex items-center gap-2 bg-white text-black px-5 py-3 rounded-2xl font-semibold hover:scale-105 transition"
                >
                    <ShoppingCart size={20} />
                    <span className="hidden sm:inline">Cart</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Products */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
                {products.length === 0 ? (
                    <div className="text-center py-24 text-gray-500">
                        <Store size={64} className="mx-auto mb-4 opacity-30" />
                        <p className="text-xl">This store has no products yet.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-8">Products</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {products.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition group"
                                >
                                    {p.image ? (
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-44 bg-white/5 flex items-center justify-center">
                                            <Store size={32} className="text-gray-600" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-bold mb-1 truncate">{p.name}</h3>
                                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                                            {p.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-green-400 font-bold">
                                                ₦{Number(p.price).toLocaleString()}
                                            </p>
                                            <button
                                                onClick={() => addToCart(p)}
                                                className="bg-white text-black p-2 rounded-xl hover:scale-110 transition"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        className="flex-1 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCart(false)}
                    />
                    <div className="w-full max-w-sm bg-gray-900 border-l border-white/10 flex flex-col h-full overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                            <h3 className="text-xl font-bold">Your Cart</h3>
                            <button onClick={() => setShowCart(false)}>
                                <X size={24} className="text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-3">
                                <ShoppingCart size={48} className="opacity-30" />
                                <p>Your cart is empty</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 px-6 py-4 flex flex-col gap-4">
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 bg-white/5 rounded-2xl p-4"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{item.name}</p>
                                                <p className="text-green-400 text-sm">
                                                    ₦{(item.price * item.qty).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQty(item.id, -1)}
                                                    className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20 transition"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-6 text-center text-sm font-bold">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(item.id, 1)}
                                                    className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20 transition"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-red-400 ml-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-6 py-6 border-t border-white/10">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-gray-400">Total</span>
                                        <span className="font-bold text-xl">
                                            ₦{cartTotal.toLocaleString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCart(false);
                                            setShowCheckout(true);
                                        }}
                                        className="w-full bg-green-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition"
                                    >
                                        <MessageCircle size={20} />
                                        Checkout via WhatsApp
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Complete Order</h3>
                            <button onClick={() => setShowCheckout(false)}>
                                <X size={24} className="text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm mb-6">
                            Enter your details and we'll send your order directly to the
                            vendor on WhatsApp.
                        </p>

                        <div className="flex flex-col gap-4">
                            <input
                                placeholder="Your Full Name *"
                                value={customerForm.name}
                                onChange={(e) =>
                                    setCustomerForm({ ...customerForm, name: e.target.value })
                                }
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                            />
                            <input
                                placeholder="Your WhatsApp Number *"
                                value={customerForm.phone}
                                onChange={(e) =>
                                    setCustomerForm({ ...customerForm, phone: e.target.value })
                                }
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                            />
                            <input
                                placeholder="Delivery Address (optional)"
                                value={customerForm.address}
                                onChange={(e) =>
                                    setCustomerForm({ ...customerForm, address: e.target.value })
                                }
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                            />

                            <div className="bg-white/5 rounded-2xl p-4 text-sm">
                                <p className="text-gray-400 mb-2">Order Summary</p>
                                {cart.map((i) => (
                                    <div key={i.id} className="flex justify-between py-1">
                                        <span className="text-gray-300">
                                            {i.name} x{i.qty}
                                        </span>
                                        <span className="font-semibold">
                                            ₦{(i.price * i.qty).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-3 border-t border-white/10 mt-2">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-green-400">
                                        ₦{cartTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleWhatsAppCheckout}
                                disabled={!customerForm.name || !customerForm.phone}
                                className="bg-green-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition disabled:opacity-40 disabled:scale-100"
                            >
                                <MessageCircle size={20} />
                                Send Order on WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 md:px-12 py-8 text-center text-gray-500 text-sm">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <span>© 2025 Shophala. Built for African businesses.</span>
                    <Link to="/legal" className="hover:text-white transition">Terms & Privacy</Link>
                </div>
            </footer>
        </div>
    );
}