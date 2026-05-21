import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
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
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/login");
      setUser(u);

      // Fetch everything simultaneously
      const [vendorSnap, productSnap, orderSnap] = await Promise.all([
        getDocs(query(collection(db, "vendors"), where("uid", "==", u.uid))),
        getDocs(query(collection(db, "products"), where("vendorId", "==", u.uid))),
        getDocs(query(collection(db, "orders"), where("vendorId", "==", u.uid))),
      ]);

      if (!vendorSnap.empty) setVendor(vendorSnap.docs[0].data());
      setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setOrders(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAddProduct = async () => {
    if (!form.name || !form.price) {
      setUploadError("Product name and price are required.");
      return;
    }

    setAddingProduct(true);
    setUploadError("");

    try {
      let imageUrl = "";

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("key", import.meta.env.VITE_IMGBB_KEY);

        const res = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          imageUrl = data.data.url;
        } else {
          setUploadError("Image upload failed. Try again.");
          setAddingProduct(false);
          return;
        }
      }

      const newProduct = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category,
        image: imageUrl,
        vendorId: user.uid,
        createdAt: new Date(),
      };

      const ref = await addDoc(collection(db, "products"), newProduct);
      setProducts([...products, { id: ref.id, ...newProduct }]);
      setForm({ name: "", price: "", description: "", image: "", category: "" });
      setImageFile(null);
      setImagePreview("");
      setShowAddProduct(false);
    } catch (err) {
      setUploadError("Something went wrong. Please try again.");
    }

    setAddingProduct(false);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "products", id));
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const storeLink = `${window.location.origin}/store/${user?.uid}`;

  const copyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400 text-xl animate-pulse">Loading your store...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold">Shophala</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">
            {vendor?.storeName}
          </span>
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
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition ${
                activeTab === tab ? "bg-white text-black" : "text-gray-400 hover:text-white"
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
                    <p className="text-green-400 font-bold text-sm">₦{o.total?.toLocaleString()}</p>
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
                    <p className="text-white font-bold text-sm">₦{Number(p.price).toLocaleString()}</p>
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
                    {p.image && (
                      <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                    )}
                    <h4 className="font-bold mb-1">{p.name}</h4>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-green-400 font-bold">₦{Number(p.price).toLocaleString()}</p>
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
                      <p className="text-green-400 font-bold text-lg">₦{o.total?.toLocaleString()}</p>
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
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
              <button onClick={() => setShowAddProduct(false)}>
                <X size={24} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {/* Image Upload */}
              <div
                onClick={() => document.getElementById("imageInput").click()}
                className="w-full h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <>
                    <Plus size={32} className="text-gray-500 mb-2" />
                    <p className="text-gray-500 text-sm">Click to upload product image</p>
                  </>
                )}
              </div>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />

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
                className="bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition mt-2 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {addingProduct ? "Adding Product..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}