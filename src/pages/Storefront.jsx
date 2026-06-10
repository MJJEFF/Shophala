import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    collection, getDocs, query, where,
    getDoc, doc, addDoc, updateDoc, increment
} from "firebase/firestore";
import { db } from "../firebase";
import PageLoader from "../components/PageLoader";
import { analytics } from "../utils/analytics";
import {
    ShoppingCart, Plus, Minus, X,
    MessageCircle, Store, Search, Share2, Tag
} from "lucide-react";

export default function Storefront() {
    const { vendor } = useParams();
    const [vendorData, setVendorData] = useState(null);
    const [resolvedVendorId, setResolvedVendorId] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [orderSent, setOrderSent] = useState(false);
    const [customerForm, setCustomerForm] = useState({ name: "", phone: "", address: "" });
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
                let resolvedVendor = null;

                const vendorDoc = await getDoc(doc(db, "vendors", vendor));
                if (vendorDoc.exists()) {
                    resolvedVendor = { id: vendorDoc.id, ...vendorDoc.data() };
                } else {
                    const slugSnap = await getDocs(
                        query(collection(db, "vendors"), where("slug", "==", vendor))
                    );
                    if (!slugSnap.empty) {
                        resolvedVendor = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() };
                    }
                }

                if (!resolvedVendor) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                // Fetch plan
                try {
                    const planDoc = await getDoc(doc(db, "plans", resolvedVendor.id));
                    if (planDoc.exists()) {
                        const planData = planDoc.data();
                        const expires = planData.expiresAt?.toDate();
                        const activePlan = expires && expires < new Date() ? "free" : planData.plan;
                        resolvedVendor = { ...resolvedVendor, plan: activePlan };
                    }
                } catch (_) { }

                setVendorData(resolvedVendor);
                setResolvedVendorId(resolvedVendor.id);
                analytics.viewStore(vendor);

                // Visit count
                try {
                    await updateDoc(doc(db, "vendors", resolvedVendor.id), {
                        visitCount: increment(1),
                    });
                } catch (_) { }

                // Fetch products
                const productSnap = await getDocs(
                    query(collection(db, "products"), where("vendorId", "==", resolvedVendor.id))
                );
                setProducts(productSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Storefront error:", err);
                setNotFound(true);
            }
            setLoading(false);
        };
        fetchStore();
    }, [vendor]);

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === product.id);
            if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...product, qty: 1 }];
        });
        analytics.addToCart(product.name, product.price);
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const updateQty = (id, delta) => {
        setCart(prev =>
            prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
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
                    where("vendorId", "==", resolvedVendorId)
                )
            );
            if (snap.empty) { setPromoError("Invalid promo code."); return; }
            setPromoApplied({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } catch (_) { setPromoError("Failed to apply code."); }
    };

    const handleWhatsAppCheckout = async () => {
        if (!customerForm.name || !customerForm.phone) return;

        const itemsList = cart
            .map(i => `• ${i.name} x${i.qty} — ₦${(i.price * i.qty).toLocaleString()}`)
            .join("\n");

        const discountText = promoApplied
            ? `\n*Promo (${promoApplied.code}):* -₦${discount.toLocaleString()}`
            : "";

        const message = `Hello ${vendorData?.storeName}! 🛍️

I'd like to place an order:

*Order Details:*
${itemsList}${discountText}

*Total: ₦${finalTotal.toLocaleString()}*

*My Details:*
Name: ${customerForm.name}
Phone: ${customerForm.phone}
${customerForm.address ? `Address: ${customerForm.address}` : ""}

Please confirm my order. Thank you!`;

        // ✅ Save order to Firestore — this is what makes Revenue work
        try {
            await addDoc(collection(db, "orders"), {
                vendorId: resolvedVendorId,
                vendorStoreName: vendorData?.storeName,
                customerName: customerForm.name,
                customerPhone: customerForm.phone,
                address: customerForm.address || "",
                items: cart.map(i => ({
                    name: i.name,
                    price: i.price,
                    qty: i.qty,
                    productId: i.id,
                })),
                subtotal: cartTotal,
                discount,
                total: finalTotal,
                promoCode: promoApplied?.code || null,
                status: "new",
                createdAt: new Date(),
            });
            analytics.purchase(finalTotal, cart.map(i => ({ name: i.name, qty: i.qty })));
        } catch (err) {
            console.error("Order save error:", err);
        }

        const whatsappNumber = vendorData.phone.replace(/\D/g, "");
        const intlNumber = whatsappNumber.startsWith("0") ? "234" + whatsappNumber.slice(1) : whatsappNumber;
        window.open(`https://wa.me/${intlNumber}?text=${encodeURIComponent(message)}`, "_blank");

        setOrderSent(true);
        setShowCheckout(false);
        setCart([]);
        setCustomerForm({ name: "", phone: "", address: "" });
        setPromoApplied(null);
        setPromoCode("");
    };

    if (loading) return <PageLoader message="Loading store..." />;

    if (notFound)
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <Store size={40} className="text-gray-600" />
                </div>
                <h1 className="text-3xl font-bold text-center">Store not found</h1>
                <p className="text-gray-400 text-center max-w-sm">
                    This store link is invalid or has been removed.
                </p>
                <a href="https://shophala.vercel.app"
                    className="text-green-400 hover:underline text-sm">
                    Create your own free store →
                </a>
            </div>
        );

    return (
        <div className="min-h-screen bg-black text-white">

            {/* Order Success Banner */}
            {orderSent && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white text-center py-3 px-6 text-sm font-semibold flex items-center justify-center gap-3">
                    <span>✅ Order sent! Check WhatsApp for confirmation.</span>
                    <button onClick={() => setOrderSent(false)} className="opacity-70 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Sticky Header */}
            <div className="border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 bg-black/95 backdrop-blur-md z-30">
                <div className="flex items-center gap-3 min-w-0">
                    {vendorData?.logo ? (
                        <img src={vendorData.logo} alt={vendorData.storeName}
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-white/10" />
                    ) : (
                        <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center font-bold text-xl text-black flex-shrink-0">
                            {vendorData?.storeName?.[0]?.toUpperCase() || "S"}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-base font-bold truncate leading-tight">{vendorData?.storeName}</h1>
                        {vendorData?.storeDescription && (
                            <p className="text-gray-400 text-xs truncate">{vendorData.storeDescription}</p>
                        )}
                        {vendorData?.plan !== "pro" && vendorData?.plan !== "business" && (
                            <p className="text-gray-600 text-xs">Powered by Shophala</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setShowCart(true)}
                    className="relative flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-2xl font-semibold hover:scale-105 transition text-sm flex-shrink-0"
                >
                    <ShoppingCart size={17} />
                    <span className="hidden sm:inline">Cart</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-32 text-gray-500">
                        <Store size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-semibold mb-2">No products yet</p>
                        <p className="text-sm">Check back soon!</p>
                    </div>
                ) : (
                    <>
                        {/* Search + Filter */}
                        <div className="mb-6 flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition pr-12 text-sm"
                                />
                                <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>

                            {categories.length > 1 && (
                                <div className="flex gap-2 flex-wrap">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${selectedCategory === cat
                                                    ? "bg-green-500 text-white"
                                                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Results count */}
                        <p className="text-gray-500 text-xs mb-4">
                            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                            {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
                        </p>

                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <p className="mb-2">No products found for "{search}"</p>
                                <button onClick={() => { setSearch(""); setSelectedCategory("All"); }}
                                    className="text-green-400 text-sm hover:underline">
                                    Clear search
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map(p => (
                                    <div key={p.id}
                                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300 group flex flex-col">

                                        {/* Product Image */}
                                        <Link to={`/store/${vendor}/product/${p.id}`} className="block relative">
                                            {p.image ? (
                                                <>
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                                        loading="lazy"
                                                    />
                                                    {/* Low stock badge */}
                                                    {p.stock !== null && p.stock !== undefined && p.stock <= 5 && p.stock > 0 && (
                                                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                            Only {p.stock} left!
                                                        </span>
                                                    )}
                                                    {/* View overlay */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                        <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                            View Details
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-48 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                                                    <Store size={32} className="text-gray-600" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Product Info */}
                                        <div className="p-3 flex flex-col flex-1">
                                            <Link to={`/store/${vendor}/product/${p.id}`}>
                                                <h3 className="font-bold text-sm mb-1 line-clamp-2 hover:text-green-400 transition leading-snug">
                                                    {p.name}
                                                </h3>
                                            </Link>
                                            {p.description && (
                                                <p className="text-gray-500 text-xs line-clamp-2 mb-2 flex-1 leading-relaxed">
                                                    {p.description}
                                                </p>
                                            )}
                                            {p.category && (
                                                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full w-fit mb-2 border border-white/5">
                                                    {p.category}
                                                </span>
                                            )}

                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                                <p className="text-green-400 font-bold text-sm">
                                                    ₦{Number(p.price).toLocaleString()}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/store/${vendor}/product/${p.id}`;
                                                            if (navigator.share) {
                                                                navigator.share({ title: p.name, url });
                                                            } else {
                                                                navigator.clipboard.writeText(url);
                                                                alert("Link copied!");
                                                            }
                                                            analytics.shareProduct(p.name);
                                                        }}
                                                        className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
                                                    >
                                                        <Share2 size={12} />
                                                    </button>
                                                    {!p.outOfStock ? (
                                                        <button
                                                            onClick={() => addToCart(p)}
                                                            className="w-8 h-8 bg-green-500 text-black rounded-xl flex items-center justify-center hover:bg-green-400 hover:scale-110 transition"
                                                        >
                                                            <Plus size={15} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-xl">
                                                            Sold out
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Floating Cart Button (mobile) */}
            {cartCount > 0 && !showCart && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
                    <button
                        onClick={() => setShowCart(true)}
                        className="flex items-center gap-3 bg-green-500 text-black px-6 py-3.5 rounded-full font-bold shadow-xl shadow-green-500/30 hover:bg-green-400 transition"
                    >
                        <ShoppingCart size={18} />
                        View Cart ({cartCount}) · ₦{finalTotal.toLocaleString()}
                    </button>
                </div>
            )}

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setShowCart(false)} />
                    <div className="w-full max-w-sm bg-gray-950 border-l border-white/10 flex flex-col h-full">

                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-bold">Your Cart</h3>
                                <p className="text-gray-500 text-xs">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
                            </div>
                            <button onClick={() => setShowCart(false)}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <X size={15} />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4 px-6">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <ShoppingCart size={28} className="opacity-40" />
                                </div>
                                <p className="font-semibold">Your cart is empty</p>
                                <button onClick={() => setShowCart(false)}
                                    className="bg-white/10 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition">
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-3 bg-white/5 rounded-2xl p-3">
                                            {item.image && (
                                                <img src={item.image} alt={item.name}
                                                    className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{item.name}</p>
                                                <p className="text-green-400 text-sm font-bold">
                                                    ₦{(item.price * item.qty).toLocaleString()}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <button onClick={() => updateQty(item.id, -1)}
                                                        className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                                                        <Minus size={10} />
                                                    </button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)}
                                                        className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                                                        <Plus size={10} />
                                                    </button>
                                                    <button onClick={() => removeFromCart(item.id)}
                                                        className="ml-auto text-red-400 hover:text-red-300">
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-4 py-4 border-t border-white/10 flex flex-col gap-3">
                                    {/* Promo */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                                            <Tag size={13} className="text-gray-500 flex-shrink-0" />
                                            <input
                                                placeholder="Promo code"
                                                value={promoCode}
                                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                                className="bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm w-full"
                                            />
                                        </div>
                                        <button onClick={handleApplyPromo}
                                            className="bg-white/10 px-3 rounded-xl text-sm font-semibold hover:bg-white/20 transition">
                                            Apply
                                        </button>
                                    </div>
                                    {promoError && <p className="text-red-400 text-xs">{promoError}</p>}
                                    {promoApplied && (
                                        <p className="text-green-400 text-xs">
                                            ✓ {promoApplied.type === "percent"
                                                ? `${promoApplied.discount}% off applied!`
                                                : `₦${promoApplied.discount} off!`}
                                        </p>
                                    )}

                                    {promoApplied && (
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Discount</span>
                                            <span className="text-green-400">-₦{discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-semibold">Total</span>
                                        <span className="font-bold text-xl text-green-400">₦{finalTotal.toLocaleString()}</span>
                                    </div>

                                    <button
                                        onClick={() => { setShowCart(false); setShowCheckout(true); }}
                                        className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition"
                                    >
                                        <MessageCircle size={18} />
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-0 sm:px-6">
                    <div className="bg-gray-950 border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-xl font-bold">Complete Order</h3>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    Ordering from {vendorData?.storeName}
                                </p>
                            </div>
                            <button onClick={() => setShowCheckout(false)}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <input
                                placeholder="Your Full Name *"
                                value={customerForm.name}
                                onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                autoComplete="name"
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition text-sm"
                            />
                            <input
                                placeholder="Your WhatsApp Number *"
                                value={customerForm.phone}
                                onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                type="tel"
                                autoComplete="tel"
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition text-sm"
                            />
                            <input
                                placeholder="Delivery Address (optional)"
                                value={customerForm.address}
                                onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition text-sm"
                            />

                            {/* Order Summary */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                                    Order Summary
                                </p>
                                {cart.map(i => (
                                    <div key={i.id} className="flex justify-between py-1.5 text-sm">
                                        <span className="text-gray-300">{i.name} × {i.qty}</span>
                                        <span className="font-semibold">₦{(i.price * i.qty).toLocaleString()}</span>
                                    </div>
                                ))}
                                {promoApplied && (
                                    <div className="flex justify-between py-1.5 text-sm">
                                        <span className="text-green-400">Promo ({promoApplied.code})</span>
                                        <span className="text-green-400">-₦{discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t border-white/10 mt-1">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-green-400 text-lg">
                                        ₦{finalTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleWhatsAppCheckout}
                                disabled={!customerForm.name || !customerForm.phone}
                                className="bg-green-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition disabled:opacity-40 disabled:cursor-not-allowed text-base"
                            >
                                <MessageCircle size={20} />
                                Send Order on WhatsApp
                            </button>

                            <p className="text-gray-600 text-xs text-center">
                                Your details will only be shared with {vendorData?.storeName}.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            {vendorData?.plan !== "pro" && vendorData?.plan !== "business" && (
                <footer className="border-t border-white/5 px-6 py-5 text-center mt-8">
                    <a href="https://shophala.vercel.app"
                        className="text-gray-600 text-xs hover:text-white transition">
                        🛍️ Powered by Shophala — Create your free store
                    </a>
                </footer>
            )}
        </div>
    );
}