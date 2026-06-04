import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import { analytics } from "../utils/analytics";

export default function Login() {
    const [step, setStep] = useState("email"); // email | otp | name
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const navigate = useNavigate();

    // Get referral from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    const handleSendOtp = async () => {
        setError("");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            // Check if user exists
            const methods = await fetch("/api/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const userData = await methods.json();
            setIsNewUser(!userData.exists);

            // Send OTP
            const res = await fetch("/api/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name: "" }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            if (!userData.exists) {
                setStep("name");
            } else {
                setStep("otp");
            }
        } catch (err) {
            setError("Failed to send code. Please try again.");
        }
        setLoading(false);
    };

    const handleContinueWithName = async () => {
        setError("");
        if (name.trim().length < 2) {
            setError("Please enter your full name.");
            return;
        }
        if (phone.replace(/\D/g, "").length < 10) {
            setError("Please enter a valid WhatsApp number.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setStep("otp");
        } catch (err) {
            setError("Failed to send code. Please try again.");
        }
        setLoading(false);
    };

    const handleVerifyOtp = async () => {
        setError("");
        if (otp.length !== 6) {
            setError("Please enter the 6-digit code.");
            return;
        }
        setLoading(true);
        try {
            // Verify OTP
            const res = await fetch("/api/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: otp }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Invalid code.");
                setLoading(false);
                return;
            }

            // Create or sign in Firebase user
            const password = `shophala_${email}_secure_2025`;

            if (isNewUser) {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "vendors", cred.user.uid), {
                    name,
                    email,
                    phone,
                    uid: cred.user.uid,
                    createdAt: new Date(),
                    storeName: name + "'s Store",
                    emailVerified: true,
                    plan: "free",
                    ...(refCode ? { referredBy: refCode } : {}),
                });
                analytics.signup("email_otp");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                analytics.login("email_otp");
            }

            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("Account issue. Please contact support.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
        setLoading(false);
    };

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
                    ...(refCode ? { referredBy: refCode } : {}),
                });
                analytics.signup("google");
            } else {
                analytics.login("google");
            }
            navigate("/dashboard");
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                setError("Google sign-in failed. Please try again.");
            }
        }
        setLoading(false);
    };

    const handleResend = async () => {
        setOtp("");
        setError("");
        setLoading(true);
        try {
            await fetch("/api/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name }),
            });
        } catch (err) {
            setError("Failed to resend. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/"><Logo size={36} /></Link>
            </nav>

            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">

                    {/* Step: Email */}
                    {step === "email" && (
                        <>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Welcome to Shophala</h2>
                            <p className="text-gray-400 mb-8">Enter your email to sign up or log in.</p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Google */}
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

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-gray-500 text-sm">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            <div className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                                    autoComplete="email"
                                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                                />
                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    className="bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>Continue <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </div>

                            <p className="text-gray-500 text-xs text-center mt-6">
                                By continuing you agree to our{" "}
                                <Link to="/legal" className="text-green-400 hover:underline">Terms & Privacy</Link>
                            </p>
                        </>
                    )}

                    {/* Step: Name (new users only) */}
                    {step === "name" && (
                        <>
                            <button
                                onClick={() => setStep("email")}
                                className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <h2 className="text-3xl font-bold mb-2">Create your store</h2>
                            <p className="text-gray-400 mb-8">Just a few details to get you started.</p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <input
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                                />
                                <input
                                    placeholder="WhatsApp number (e.g. 08012345678)"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    type="tel"
                                    autoComplete="tel"
                                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                                />
                                <button
                                    onClick={handleContinueWithName}
                                    disabled={loading}
                                    className="bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>Send Verification Code <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step: OTP */}
                    {step === "otp" && (
                        <>
                            <button
                                onClick={() => setStep(isNewUser ? "name" : "email")}
                                className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">📧</div>
                                <h2 className="text-3xl font-bold mb-2">Check your email</h2>
                                <p className="text-gray-400 text-sm">
                                    We sent a 6-digit code to
                                </p>
                                <p className="text-white font-semibold mt-1">{email}</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <input
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                                maxLength={6}
                                autoComplete="one-time-code"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition text-center text-3xl tracking-[0.5em] font-bold mb-4"
                            />

                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-white text-black py-4 rounded-2xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 mb-4"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>Verify & Continue <ArrowRight size={20} /></>
                                )}
                            </button>

                            <button
                                onClick={handleResend}
                                disabled={loading}
                                className="w-full text-gray-400 hover:text-white text-sm transition py-2"
                            >
                                Didn't receive it? Resend code
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}