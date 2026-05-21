import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [isSignup, setIsSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        setError("");

        // Password strength check
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        // Name check for signup
        if (isSignup && form.name.trim().length < 2) {
            setError("Please enter your full name.");
            return;
        }

        // Phone check for signup
        if (isSignup && form.phone.replace(/\D/g, "").length < 10) {
            setError("Please enter a valid WhatsApp number.");
            return;
        }

        setLoading(true);
        try {
            if (isSignup) {
                const cred = await createUserWithEmailAndPassword(
                    auth,
                    form.email,
                    form.password
                );

                // Send email verification
                await sendEmailVerification(cred.user);

                // Save vendor profile to Firestore
                await setDoc(doc(db, "vendors", cred.user.uid), {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    uid: cred.user.uid,
                    createdAt: new Date(),
                    storeName: form.name + "'s Store",
                    emailVerified: false,
                    plan: "free",
                });

                // Show verification message instead of redirecting
                setVerificationSent(true);

            } else {
                const cred = await signInWithEmailAndPassword(auth, form.email, form.password);

                // Block unverified users
                if (!cred.user.emailVerified) {
                    await signOut(auth);
                    setError("Please verify your email before logging in. Check your inbox or spam folder.");
                    setLoading(false);
                    return;
                }

                navigate("/dashboard");
            }
        } catch (err) {
            const msg = err.code;
            if (msg === "auth/user-not-found") setError("No account found with this email.");
            else if (msg === "auth/wrong-password") setError("Incorrect password. Try again.");
            else if (msg === "auth/too-many-requests") setError("Too many attempts. Try again later.");
            else if (msg === "auth/email-already-in-use") setError("An account with this email already exists.");
            else setError("Something went wrong. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/" className="text-2xl font-bold">Shophala</Link>
            </nav>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">
                    {/* Toggle */}
                    <div className="flex bg-white/5 rounded-2xl p-1 mb-10">
                        <button
                            onClick={() => setIsSignup(false)}
                            className={`flex-1 py-3 rounded-xl font-semibold transition ${!isSignup ? "bg-white text-black" : "text-gray-400"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsSignup(true)}
                            className={`flex-1 py-3 rounded-xl font-semibold transition ${isSignup ? "bg-white text-black" : "text-gray-400"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                        {isSignup ? "Create your store" : "Welcome back"}
                    </h2>
                    <p className="text-gray-400 mb-8">
                        {isSignup
                            ? "Start selling on WhatsApp in minutes."
                            : "Login to manage your Shophala store."}
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {verificationSent && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-4 rounded-xl mb-6 text-sm text-center">
                            <p className="font-bold mb-1">Check your email! 📧</p>
                            <p>We sent a verification link to <strong>{form.email}</strong>.</p>
                            <p className="mt-1">Verify your email then come back to login.</p>
                        </div>
                    )}


                    <div className="flex flex-col gap-4">
                        {isSignup && (
                            <input
                                name="name"
                                placeholder="Full Name"
                                value={form.name}
                                onChange={handleChange}
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                            />
                        )}

                        <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                        />

                        {isSignup && (
                            <input
                                name="phone"
                                type="tel"
                                placeholder="WhatsApp Number (e.g. 08012345678)"
                                value={form.phone}
                                onChange={handleChange}
                                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                            />
                        )}

                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition pr-14"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-white text-black px-7 py-4 rounded-2xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:scale-100"
                        >
                            {loading
                                ? "Please wait..."
                                : isSignup
                                    ? "Create Store"
                                    : "Login"}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}