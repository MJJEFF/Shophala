import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import usePlan from "../hooks/usePlan";
import {
  ShoppingBag,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Copy,
  X,
  Package,
  Users,
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const { plan } = usePlan(user?.uid);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }

      if (!mounted) return;
      setUser(u);

      try {
        const [vendorDoc, productSnap, orderSnap] = await Promise.all([
          getDoc(doc(db, "vendors", u.uid)),
          getDocs(query(collection(db, "products"), where("vendorId", "==", u.uid))),
          getDocs(query(collection(db, "orders"), where("vendorId", "==", u.uid))),
        ]);

        if (!mounted) return;

        if (vendorDoc.exists()) setVendor(vendorDoc.data());
        setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setOrders(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleAddProduct = async () => {
    // Enforce free plan product limit
    if (plan === "free" && products.length >= 10) {
      alert("Free plan is limited to 10 products. Upgrade to Pro for unlimited products.");
      setShowAddProduct(false);
      window.location.href = "/pricing";
      return;
    }

    if (!form.name || !form.price) return;
    setAddingProduct(true);
    setUploadError("");

    let imageUrl = "";

    if (imageFile) {
      try {
        setUploadProgress(20);
        const formData = new FormData();
        formData.append("image", imageFile);

        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formData }
        );

        const data = await res.json();
        setUploadProgress(80);

        if (data.success) {
          imageUrl = data.data.display_url;
          setUploadProgress(100);
        } else {
          throw new Error(data.error?.message || "Upload failed");
        }
      } catch (err) {
        console.error("Image upload error:", err);
        setUploadError("Image upload failed. Product will be saved without image.");
        imageUrl = "";
      }
    }

    try {
      const newProduct = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category,
        image: imageUrl,
        vendorId: user.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "products"), newProduct);
      setProducts((prev) => [...prev, { id: docRef.id, ...newProduct }]);
      setForm({ name: "", price: "", description: "", category: "" });
      setImageFile(null);
      setUploadProgress(0);
      setShowAddProduct(false);
    } catch (err) {
      console.error("Add product error:", err);
      setUploadError("Failed to save product. Please try again.");
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleToggleStock = async (id, currentStatus) => {
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "products", id), {
      outOfStock: !currentStatus,
    });
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, outOfStock: !currentStatus } : p)
    );
  };

  const storeLink = `${window.location.origin}/store/${vendor?.slug || user?.uid}`;

  const copyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-gray-400">Loading your store... Please wait.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
        <Link to="/">
          <Logo size={36} />
        </Link>
        <Link
          to="/analytics"
          className="text-gray-400 hover:text-white transition text-sm"
        >
          Analytics
        </Link>
        <Link
          to="/settings"
          className="text-gray-400 hover:text-white transition text-sm"
        >
          Settings
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">
            {vendor?.storeName}
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${plan === "pro" ? "bg-blue-500/20 text-blue-400" :
                plan === "business" ? "bg-purple-500/20 text-purple-400" :
                  "bg-white/10 text-gray-400"
              }`}>
              {plan === "free" ? "Free Plan" : plan === "pro" ? "Pro ⚡" : "Business 🏢"}
            </span>
            {plan === "free" && (
              <Link
                to="/pricing"
                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-full font-semibold hover:bg-green-400 transition"
              >
                Upgrade ⚡
              </Link>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        {/* Store Link Banner */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-gray-400 text-sm mb-1">Your Store Link</p>
            <p className="text-white font-mono text-sm truncate max-w-xs sm:max-w-md">
              {storeLink}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition"
          >
            <Copy size={16} />
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: <BarChart3 size={20} /> },
            { label: "Orders", value: orders.length, icon: <ShoppingBag size={20} /> },
            { label: "Products", value: products.length, icon: <Package size={20} /> },
            { label: "Customers", value: [...new Set(orders.map((o) => o.customerPhone))].length, icon: <Users size={20} /> },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-gray-400 mb-3 text-sm">
                {s.icon} {s.label}
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
          {["overview", "products", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition ${activeTab === tab ? "bg-white text-black" : "text-gray-400 hover:text-white"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500">No orders yet. Share your store link!</p>
              ) : (
                orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-semibold text-sm">{o.customerName}</p>
                      <p className="text-gray-500 text-xs">{o.customerPhone}</p>
                    </div>
                    <p className="text-green-400 font-bold text-sm">
                      ₦{o.total?.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Top Products</h3>
              {products.length === 0 ? (
                <p className="text-gray-500">No products yet. Add your first product!</p>
              ) : (
                products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-white font-bold text-sm">
                      ₦{Number(p.price).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Your Products</h3>
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold text-sm hover:scale-105 transition"
              >
                <Plus size={18} /> Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p>No products yet. Add your first one!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((p) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-40 object-cover rounded-xl mb-4"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-40 bg-white/5 rounded-xl mb-4 flex items-center justify-center">
                        <Package size={32} className="text-gray-600" />
                      </div>
                    )}
                    <h4 className="font-bold mb-1">{p.name}</h4>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{p.description}</p>

                    {/* Stock toggle */}
                    <button
                      onClick={() => handleToggleStock(p.id, p.outOfStock)}
                      className={`text-xs px-3 py-1 rounded-full mb-3 font-semibold transition ${
                        p.outOfStock
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                    >
                      {p.outOfStock ? "Out of Stock" : "In Stock"}
                    </button>

                    <div className="flex items-center justify-between">
                      <p className="text-green-400 font-bold">
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <h3 className="text-xl font-bold mb-6">All Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                <p>No orders yet. Share your store link to start selling!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold">{o.customerName}</p>
                      <p className="text-gray-400 text-sm">{o.customerPhone}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {o.items?.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">
                        ₦{o.total?.toLocaleString()}
                      </p>
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                        WhatsApp Order
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 md:px-12 py-8 text-center text-gray-500 text-sm">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <span>© 2025 Shophala. Built for African businesses.</span>
          <Link to="/legal" className="hover:text-white transition">Terms & Privacy</Link>
        </div>
      </footer>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-gray-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add Product</h3>
              <button onClick={() => {
                setShowAddProduct(false);
                setImageFile(null);
                setUploadProgress(0);
                setUploadError("");
              }}>
                <X size={24} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Image Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Product Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImageFile(e.target.files[0]);
                    setUploadError("");
                  }}
                  className="w-full text-gray-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                />
                {imageFile && (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="preview"
                    className="mt-3 w-full h-40 object-cover rounded-xl"
                  />
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <input
                name="name"
                placeholder="Product Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
              />
              <input
                name="price"
                type="number"
                placeholder="Price (₦) *"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
              />
              <input
                name="category"
                placeholder="Category (e.g. Shoes, Food)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
              />
              <textarea
                name="description"
                placeholder="Product Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition resize-none"
              />

              {uploadError && (
                <p className="text-red-400 text-sm">{uploadError}</p>
              )}

              <button
                onClick={handleAddProduct}
                disabled={addingProduct || !form.name || !form.price}
                className="bg-white text-black py-4 rounded-2xl font-semibold transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 disabled:scale-100"
              >
                {addingProduct ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    {imageFile ? "Uploading image..." : "Adding product..."}
                  </>
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}