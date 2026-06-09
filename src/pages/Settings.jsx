import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import PageLoader from "../components/PageLoader";
import { ArrowLeft, Save, Copy, Check } from "lucide-react";

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState("");
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [form, setForm] = useState({
        name: "",
        storeName: "",
        phone: "",
        email: "",
        storeDescription: "",
        slug: "",
        logo: "",
    });
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return navigate("/login");
            setUser(u);
            const vendorDoc = await getDoc(doc(db, "vendors", u.uid));
            if (vendorDoc.exists()) {
                const data = vendorDoc.data();
                setForm({
                    name: data.name || "",
                    storeName: data.storeName || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    storeDescription: data.storeDescription || "",
                    slug: data.slug || "",
                    logo: data.logo || "",
                });
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const handleSave = async () => {
        if (!form.storeName || !form.phone) {
            alert("Store name and WhatsApp number are required.");
            return;
        }

        // Clean slug
        const cleanSlug = form.slug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        let logoUrl = form.logo;
        if (logoFile) {
            setUploadingLogo(true);
            try {
                const formData = new FormData();
                formData.append("image", logoFile);
                const res = await fetch(
                    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
                    { method: "POST", body: formData }
                );
                const data = await res.json();
                if (data.success) logoUrl = data.data.display_url;
            } catch (err) {
                console.error("Logo upload failed:", err);
            }
            setUploadingLogo(false);
        }

        if (cleanSlug && cleanSlug.length < 3) {
            alert("Store URL must be at least 3 characters.");
            return;
        }

        setSaving(true);
        try {
            // Check if slug is taken by another vendor
            if (cleanSlug) {
                const { getDocs, collection, query, where } = await import("firebase/firestore");
                const slugCheck = await getDocs(
                    query(collection(db, "vendors"), where("slug", "==", cleanSlug))
                );
                const taken = slugCheck.docs.find(d => d.id !== user.uid);
                if (taken) {
                    alert("That store URL is already taken. Please choose another.");
                    setSaving(false);
                    return;
                }
            }

            await updateDoc(doc(db, "vendors", user.uid), {
                name: form.name,
                storeName: form.storeName,
                phone: form.phone,
                storeDescription: form.storeDescription,
                slug: cleanSlug,
                logo: logoUrl,
                updatedAt: new Date(),
            });
            setForm((prev) => ({ ...prev, logo: logoUrl }));
            setLogoFile(null);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save. Please try again.");
        }
        setSaving(false);
    };

    const storeLink = `${window.location.origin}/store/${form.slug || user?.uid}`;

    const copyLink = () => {
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading)
        return <PageLoader message="Loading settings..." />;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-gray-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Store Settings</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold text-sm hover:scale-105 transition disabled:opacity-50"
                >
                    {saved ? <Check size={16} /> : <Save size={16} />}
                    {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </button>
            </nav>

            <div className="max-w-2xl mx-auto px-6 md:px-12 py-10">

                {/* Store Link */}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Your Store Link</p>
                        <p className="text-white font-mono text-xs truncate max-w-xs">
                            {storeLink}
                        </p>
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition"
                    >
                        <Copy size={14} />
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Your full name"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Store Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {logoPreview || form.logo ? (
                                    <img src={logoPreview || form.logo} alt="logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-600 text-2xl font-bold">
                                        {form.storeName?.[0]?.toUpperCase() || "S"}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setLogoFile(file);
                                        setLogoPreview(URL.createObjectURL(file));
                                    }}
                                    className="w-full text-gray-400 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                                />
                                <p className="text-gray-500 text-xs mt-1">PNG, JPG up to 2MB. Square image recommended.</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            Store Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            value={form.storeName}
                            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                            placeholder="e.g. Amaka's Fashion Store"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                        />
                        <p className="text-gray-500 text-xs mt-2">
                            This is what customers see on your storefront.
                        </p>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            Custom Store URL
                        </label>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-white/30 transition">
                            <span className="text-gray-500 text-sm mr-2 whitespace-nowrap">
                                shophala.vercel.app/store/
                            </span>
                            <input
                                value={form.slug}
                                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                placeholder="your-store-name"
                                className="bg-transparent text-white placeholder-gray-600 focus:outline-none flex-1 text-sm"
                            />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                            Only letters, numbers and hyphens. e.g. amakas-fashion
                        </p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            WhatsApp Number <span className="text-red-400">*</span>
                        </label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="e.g. 08012345678"
                            type="tel"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                        />
                        <p className="text-gray-500 text-xs mt-2">
                            Customers send orders to this number via WhatsApp.
                        </p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email</label>
                        <input
                            value={form.email}
                            disabled
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-gray-500 text-xs mt-2">Email cannot be changed.</p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            Store Description
                        </label>
                        <textarea
                            value={form.storeDescription}
                            onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
                            placeholder="Tell customers what you sell e.g. Quality fashion items, electronics, food..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saved ? <Check size={18} /> : <Save size={18} />}
                        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}