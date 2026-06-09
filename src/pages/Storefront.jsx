import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs, query, where, getDoc, doc, increment } from "firebase/firestore";
import { db } from "../firebase";
import PageLoader from "../components/PageLoader";
import { analytics } from "../utils/analytics";

import { ShoppingCart, Plus, Minus, X, MessageCircle, Store, Search, Share2 } from "lucide-react";

export default function Storefront() {
    const { vendor } = useParams();
    // vendorData already exists, plan will be inside it
    const [vendorData, setVendorData] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
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
    const [promoCode, setPromoCode] = useState("");
    const [promoError, setPromoError] = useState("");
    const [promoApplied, setPromoApplied] = useState(null);

    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        const fetchStore = async () => {
            try {
                // First try as UID (direct fetch)
                const vendorDoc = await getDoc(doc(db, "vendors", vendor));

                if (vendorDoc.exists()) {
                    const vendorData = { id: vendorDoc.id, ...vendorDoc.data() };
                    setVendorData(vendorData);
                    analytics.viewStore(vendor);
                    try {
                        const { updateDoc, increment } = await import("firebase/firestore");
                        await updateDoc(doc(db, "vendors", vendorData.id), {
                            visitCount: increment(1),
                        });
                    } catch (err) {
                        console.log("Visit count update failed silently");
                    }
                    const productSnap = await getDocs(
                        query(collection(db, "products"), where("vendorId", "==", vendorData.id))
                    );
                    setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                    return;
                }

                // Always fetch plan separately for accuracy
                try {
                    const planDoc = await getDoc(doc(db, "plans", vendorData.id));
                    if (planDoc.exists()) {
                        const planData = planDoc.data();
                        const expires = planData.expiresAt?.toDate();
                        const activePlan = expires && expires < new Date() ? "free" : planData.plan;
                        setVendorData(prev => ({ ...prev, plan: activePlan }));
                    }
                } catch (err) {
                    console.log("Plan check failed silently");
                }

                // If not found by UID, try as slug
                const slugSnap = await getDocs(
                    query(collection(db, "vendors"), where("slug", "==", vendor))
                );

                if (slugSnap.empty) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const vendorData = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() };
                setVendorData(vendorData);
                analytics.viewStore(vendor);
                try {
                    const { updateDoc, increment } = await import("firebase/firestore");
                    await updateDoc(doc(db, "vendors", vendorData.id), {
                        visitCount: increment(1),
                    });
                } catch (err) {
                    console.log("Visit count update failed silently");
                }

                try {
                    const planDoc = await getDoc(doc(db, "plans", vendorData.id || slugSnap.docs[0].id));
                    if (planDoc.exists()) {
                        setVendorData((prev) => ({ ...prev, plan: planDoc.data().plan }));
                    }
                } catch (err) {
                    console.log("No plan found, defaulting to free");
                }

                const productSnap = await getDocs(
                    query(collection(db, "products"), where("vendorId", "==", vendorData.id))
                );
                setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Storefront error:", err);
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
        analytics.addToCart(product.name, product.price);
    };

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((i) => i.id !== id));
        analytics.removeFromCart(product.name, product.price);
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

    const discount = promoApplied
        ? promoApplied.type === "percent"
            ? (cartTotal * promoApplied.discount) / 100
            : promoApplied.discount
        : 0;
    const finalTotal = Math.max(0, cartTotal - discount);

    const handleApplyPromo = async () => {
        setPromoError("");
        if (!promoCode) return;
        try {
            const snap = await getDocs(
                query(
                    collection(db, "promoCodes"),
                    where("code", "==", promoCode),
                    where("vendorId", "==", vendorData.id)
                )
            );
            if (snap.empty) {
                setPromoError("Invalid promo code.");
                return;
            }
            setPromoApplied({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } catch (err) {
            setPromoError("Failed to apply code. Try again.");
        }
    };

    const handleWhatsAppCheckout = () => {
        if (!customerForm.name || !customerForm.phone) return;
        analytics.checkout(finalTotal);
        analytics.purchase(finalTotal, cart.map(i => ({ name: i.name, qty: i.qty })));

        const itemsList = cart
            .map((i) => `• ${i.name} x${i.qty} — ₦${(i.price * i.qty).toLocaleString()}`)
            .join("\n");

        const discountText = promoApplied
            ? `\n*Promo:* ${promoApplied.type === "percent" ? `${promoApplied.discount}% off` : `₦${promoApplied.discount} off`}`
            : "";

        const message = `Hello! I'd like to place an order from your Shophala store 🛍️

*Customer Details:*
Name: ${customerForm.name}
Phone: ${customerForm.phone}
${customerForm.address ? `Address: ${customerForm.address}` : ""}

*Order Summary:*
${itemsList}${discountText}

*Total: ₦${finalTotal.toLocaleString()}*

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

    if (loading) return <PageLoader message="Loading store..." />;

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
                <div className="flex items-center gap-4">
                    {vendorData?.logo ? (
                        <img
                            src={vendorData.logo}
                            alt={vendorData.storeName}
                            className="w-12 h-12 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">
                            {vendorData?.storeName?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{vendorData?.storeName}</h1>
                        {vendorData?.storeDescription && (
                            <p className="text-gray-400 text-sm mt-0.5">{vendorData.storeDescription}</p>
                        )}
                        {vendorData?.plan !== "pro" && vendorData?.plan !== "business" && (
                            <p className="text-gray-600 text-xs mt-0.5">Powered by Shophala</p>
                        )}
                    </div>
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
                        <h2 className="text-2xl font-bold mb-6">Products</h2>

                        {/* Search */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition pr-12"
                            />
                            <Search size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>

                        {/* Category Filter */}
                        {categories.length > 1 && (
                            <div className="flex gap-2 flex-wrap mb-8">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                            selectedCategory === cat
                                                ? "bg-green-500 text-white"
                                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No results */}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16 text-gray-500">
                                <p>No products found for "{search}"</p>
                                <button
                                    onClick={() => { setSearch(""); setSelectedCategory("All"); }}
                                    className="text-green-400 mt-2 text-sm hover:underline"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    className={`bg-white/5 border rounded-2xl overflow-hidden hover:border-white/30 transition group ${
                                        p.outOfStock ? "opacity-60" : "border-white/10"
                                    }`}
                                >
                                    <Link to={`/store/${vendor}/product/${p.id}`}>
                                        {p.image ? (
                                            <img
                                                src={p.image}
                                                alt={p.name}
                                                className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-44 bg-white/5 flex items-center justify-center">
                                                <Store size={32} className="text-gray-600" />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-bold mb-1 truncate">{p.name}</h3>
                                            <p className="text-gray-400 text-xs mb-2 line-clamp-2">{p.description}</p>
                                            {p.outOfStock && (
                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                                    Out of stock
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="px-4 pb-4 flex items-center justify-between">
                                        <p className="text-green-400 font-bold">₦{Number(p.price).toLocaleString()}</p>
                                        <div className="flex items-center gap-2">
                                            {/* Share button */}
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/store/${vendor}/product/${p.id}`;
                                                    if (navigator.share) {
                                                        navigator.share({ title: p.name, text: `Check out ${p.name} — ₦${Number(p.price).toLocaleString()}`, url });
                                                    } else {
                                                        navigator.clipboard.writeText(url);
                                                        alert("Product link copied!");
                                                    }
                                                }}
                                                className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                            {!p.outOfStock && (
                                                <button
                                                    onClick={() => addToCart(p)}
                                                    className="bg-white text-black p-2 rounded-xl hover:scale-110 transition"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            )}
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

                                    <div className="px-6 py-6 border-t border-white/10 flex flex-col gap-3">
                                        {/* Promo Code in Cart */}
                                        <div className="flex gap-2">
                                            <input
                                                placeholder="Have a promo code?"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition text-sm"
                                            />
                                            <button
                                                onClick={handleApplyPromo}
                                                className="bg-white/10 px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-white/20 transition whitespace-nowrap"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {promoError && <p className="text-red-400 text-xs">{promoError}</p>}
                                        {promoApplied && (
                                            <p className="text-green-400 text-xs">
                                                ✓ {promoApplied.type === "percent"
                                                    ? `${promoApplied.discount}% discount applied!`
                                                    : `₦${promoApplied.discount} discount applied!`}
                                            </p>
                                        )}

                                        {/* Totals */}
                                        {promoApplied && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Subtotal</span>
                                                <span className="text-gray-400">₦{cartTotal.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {promoApplied && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-green-400">Discount</span>
                                                <span className="text-green-400">
                                                    -{promoApplied.type === "percent"
                                                        ? `₦${discount.toLocaleString()} (${promoApplied.discount}%)`
                                                        : `₦${discount.toLocaleString()}`}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total</span>
                                            <span className="font-bold text-xl">₦{finalTotal.toLocaleString()}</span>
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
                                {promoApplied && (
                                    <div className="flex justify-between pt-3 text-sm text-gray-300">
                                        <span>Promo discount</span>
                                        <span className="text-green-400">
                                            {promoApplied.type === "percent"
                                                ? `-₦${discount.toLocaleString()} (${promoApplied.discount}%)`
                                                : `-₦${discount.toLocaleString()}`}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t border-white/10 mt-2">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-green-400">
                                        ₦{finalTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Promo Code */}
                            <div className="flex gap-2">
                                <input
                                    placeholder="Promo code"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition text-sm"
                                />
                                <button
                                    onClick={handleApplyPromo}
                                    className="bg-white/10 px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-white/20 transition"
                                >
                                    Apply
                                </button>
                            </div>
                            {promoError && <p className="text-red-400 text-xs">{promoError}</p>}
                            {promoApplied && (
                                <p className="text-green-400 text-xs">
                                    ✓ {promoApplied.type === "percent"
                                        ? `${promoApplied.discount}% discount applied!`
                                        : `₦${promoApplied.discount} discount applied!`}
                                </p>
                            )}

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
            {vendorData?.plan !== "pro" && vendorData?.plan !== "business" && (
                <footer className="border-t border-white/10 px-6 py-6 text-center text-gray-600 text-xs">
                    Powered by{" "}
                    <a href="https://shophala.vercel.app" className="hover:text-white transition">
                        Shophala
                    </a>
                </footer>
            )}
        </div>
    );
}