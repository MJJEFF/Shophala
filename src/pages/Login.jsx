import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import emailjs from "@emailjs/browser";
import Logo from "../components/Logo";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_OTP_TEMPLATE = "template_b1wncj7";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function Login() {
    const [isSignup, setIsSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [verifyCode, setVerifyCode] = useState("");
    const [verifyUid, setVerifyUid] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const cred = await signInWithPopup(auth, provider);
            const vendorDoc = await getDoc(doc(db, "vendors", cred.user.uid));
            if (!vendorDoc.exists()) {
                await setDoc(doc(db, "vendors", cred.user.uid), {
                    name: cred.user.displayName || "",
                    email: cred.user.email,
                    phone: "",
                    uid: cred.user.uid,
                    createdAt: new Date(),
                    storeName: (cred.user.displayName || "My") + "'s Store",
                    emailVerified: true,
                    plan: "free",
                });
            }
            navigate("/dashboard");
        } catch (err) {
            if (err.code === "auth/popup-closed-by-user") {
                setError("Google sign-in was cancelled.");
            } else {
                setError("Google sign-in failed. Please try again.");
            }
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        setError("");

        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (isSignup && form.name.trim().length < 2) {
            setError("Please enter your full name.");
            return;
        }

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

                // Generate 6 digit OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                // Save OTP to Firestore
                await setDoc(doc(db, "verificationCodes", cred.user.uid), {
                    code: otp,
                    expiresAt,
                    email: form.email,
                });

                // Save vendor profile
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

                // Send OTP via EmailJS
                await emailjs.send(
                    EMAILJS_SERVICE_ID,
                    EMAILJS_OTP_TEMPLATE,
                    {
                        to_name: form.name,
                        to_email: form.email,
                        otp,
                    },
                    EMAILJS_PUBLIC_KEY
                );

                // Sign out until verified
                await signOut(auth);
                setVerifyUid(cred.user.uid);
                setVerificationSent(true);

            } else {
                const cred = await signInWithEmailAndPassword(
                    auth,
                    form.email,
                    form.password
                );

                // Check if vendor email is verified in Firestore
                const vendorDoc = await getDoc(doc(db, "vendors", cred.user.uid));
                if (vendorDoc.exists() && !vendorDoc.data().emailVerified) {
                    await signOut(auth);
                    setError("Please verify your email first. Check your inbox for the 6-digit code.");
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

    const handleVerifyCode = async () => {
        setError("");
        setVerifying(true);
        try {
            const codeDoc = await getDoc(doc(db, "verificationCodes", verifyUid));
            if (!codeDoc.exists()) {
                setError("Invalid code. Please try again.");
                setVerifying(false);
                return;
            }

            const { code, expiresAt } = codeDoc.data();

            if (expiresAt.toDate() < new Date()) {
                setError("Code expired. Please sign up again.");
                setVerifying(false);
                return;
            }

            if (verifyCode !== code) {
                setError("Wrong code. Please check your email.");
                setVerifying(false);
                return;
            }

            // Mark vendor as verified
            await updateDoc(doc(db, "vendors", verifyUid), {
                emailVerified: true,
            });

            // Sign them in
            await signInWithEmailAndPassword(auth, form.email, form.password);
            navigate("/dashboard");

        } catch (err) {
            setError("Verification failed. Please try again.");
        }
        setVerifying(false);
    };

    // Show OTP verification screen
    if (verificationSent) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                    <Link to="/">
                        <Logo size={36} />
                    </Link>
                </nav>

                <div className="flex-1 flex items-center justify-center px-6 py-16">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">📧</div>
                            <h2 className="text-3xl font-bold mb-2">Check your email</h2>
                            <p className="text-gray-400">
                                We sent a 6-digit code to
                            </p>
                            <p className="text-white font-semibold mt-1">{form.email}</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Check spam folder if you don't see it
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <input
                            placeholder="Enter 6-digit code"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                            maxLength={6}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition text-center text-3xl tracking-[0.5em] font-bold mb-4"
                        />

                        <button
                            onClick={handleVerifyCode}
                            disabled={verifying || verifyCode.length !== 6}
                            className="w-full bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {verifying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>Verify Account <ArrowRight size={20} /></>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setVerificationSent(false);
                                setVerifyCode("");
                                setError("");
                            }}
                            className="w-full text-gray-500 hover:text-white transition text-sm mt-4"
                        >
                            ← Back to signup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/">
                    <Logo size={36} />
                </Link>
            </nav>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">

                    {/* Toggle */}
                    <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
                        <button
                            onClick={() => { setIsSignup(false); setError(""); }}
                            className={`flex-1 py-3 rounded-xl font-semibold transition ${!isSignup ? "bg-white text-black" : "text-gray-400"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setIsSignup(true); setError(""); }}
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

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition disabled:opacity-50 disabled:scale-100 mb-4"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-sm">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Form Fields */}
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
                                placeholder="Password (min 8 characters)"
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
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Please wait...
                                </>
                            ) : (
                                <>
                                    {isSignup ? "Create Store" : "Login"}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}