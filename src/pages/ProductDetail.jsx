import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeft, MessageCircle, ShoppingCart, Store } from "lucide-react";

export default function ProductDetail() {
    const { vendor, productId } = useParams();
    const [product, setProduct] = useState(null);
    const [vendorData, setVendorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [qty, setQty] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Step 1 — try vendor as UID first
                let resolvedVendor = null;
                const vendorByUID = await getDoc(doc(db, "vendors", vendor));

                if (vendorByUID.exists()) {
                    resolvedVendor = { id: vendorByUID.id, ...vendorByUID.data() };
                } else {
                    // Step 2 — try vendor as slug
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

                setVendorData(resolvedVendor);

                // Step 3 — fetch product by ID
                const productDoc = await getDoc(doc(db, "products", productId));

                if (!productDoc.exists()) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                setProduct({ id: productDoc.id, ...productDoc.data() });
            } catch (err) {
                console.error("ProductDetail error:", err);
                setNotFound(true);
            }
            setLoading(false);
        };
        fetchData();
    }, [vendor, productId]);

    const handleWhatsApp = () => {
        const message = `Hello! I'd like to order this item from your Shophala store 🛍️

*Product:* ${product.name}
*Quantity:* ${qty}
*Price:* ₦${(product.price * qty).toLocaleString()}

Please confirm availability. Thank you!`;

        const number = vendorData.phone.replace(/\D/g, "");
        const intl = number.startsWith("0") ? "234" + number.slice(1) : number;
        window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`, "_blank");
    };

    if (loading)
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );

    if (notFound)
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <Store size={64} className="text-gray-600" />
                <h1 className="text-3xl font-bold">Product not found</h1>
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white transition"
                >
                    Go back
                </button>
            </div>
        );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
                <button
                    onClick={() => navigate(`/store/${vendor}`)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm">Back to store</span>
                </button>
                <h1 className="text-lg font-bold">{vendorData?.storeName}</h1>
                <div className="w-24" />
            </nav>

            {/* Product */}
            <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
                <div className="grid md:grid-cols-2 gap-10">

                    {/* Image */}
                    <div>
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-80 md:h-[480px] object-cover rounded-[2rem]"
                            />
                        ) : (
                            <div className="w-full h-80 md:h-[480px] bg-white/5 rounded-[2rem] flex items-center justify-center">
                                <Store size={64} className="text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-between">
                        <div>
                            {product.category && (
                                <span className="text-xs uppercase tracking-widest text-gray-500 mb-3 block">
                                    {product.category}
                                </span>
                            )}
                            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                                {product.name}
                            </h1>
                            <p className="text-3xl font-bold text-green-400 mb-6">
                                ₦{Number(product.price).toLocaleString()}
                            </p>
                            {product.description && (
                                <p className="text-gray-400 leading-relaxed mb-8">
                                    {product.description}
                                </p>
                            )}

                            {/* Quantity */}
                            <div className="mb-8">
                                <p className="text-gray-400 text-sm mb-3">Quantity</p>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition text-lg font-bold"
                                    >
                                        −
                                    </button>
                                    <span className="text-xl font-bold w-8 text-center">{qty}</span>
                                    <button
                                        onClick={() => setQty(qty + 1)}
                                        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition text-lg font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {qty > 1 && (
                                <div className="bg-white/5 rounded-2xl px-5 py-3 mb-6 flex justify-between">
                                    <span className="text-gray-400">Total</span>
                                    <span className="font-bold text-green-400">
                                        ₦{(product.price * qty).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleWhatsApp}
                                className="bg-green-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition"
                            >
                                <MessageCircle size={20} />
                                Order via WhatsApp
                            </button>
                            <button
                                onClick={() => navigate(`/store/${vendor}`)}
                                className="border border-white/20 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition"
                            >
                                <ShoppingCart size={20} />
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}