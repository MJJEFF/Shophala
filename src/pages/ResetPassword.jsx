import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Logo from "../components/Logo";

export default function ResetPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleReset = async () => {
        setError("");
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err) {
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/">
                    <Logo size={36} />
                </Link>
            </nav>

            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">
                    <Link
                        to="/login"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-8"
                    >
                        <ArrowLeft size={16} /> Back to Login
                    </Link>

                    {sent ? (
                        <div className="text-center">
                            <div className="text-6xl mb-6">📧</div>
                            <h2 className="text-3xl font-bold mb-3">Check your email</h2>
                            <p className="text-gray-400 mb-2">
                                We sent a password reset link to:
                            </p>
                            <p className="text-white font-semibold mb-6">{email}</p>
                            <p className="text-gray-500 text-sm mb-8">
                                Check your spam folder if you don't see it within a few minutes.
                            </p>
                            <Link to="/login">
                                <button className="bg-white text-black px-7 py-4 rounded-2xl font-semibold hover:scale-105 transition">
                                    Back to Login
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                                Reset password
                            </h2>
                            <p className="text-gray-400 mb-8">
                                Enter your email and we'll send you a reset link.
                            </p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition"
                                />
                                <button
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="bg-white text-black px-7 py-4 rounded-2xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>Send Reset Link <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}