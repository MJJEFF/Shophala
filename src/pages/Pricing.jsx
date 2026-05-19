import { Link } from "react-router-dom";
import { Check, Zap, Building2, Rocket } from "lucide-react";
import { useState, useEffect } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY;

const plans = [
    {
        name: "Starter",
        icon: <Zap size={28} />,
        monthly: 0,
        yearly: 0,
        description: "Perfect for vendors just getting started.",
        color: "border-white/10",
        badge: null,
        planId: "free",
        features: [
            "1 Storefront",
            "Up to 10 products",
            "WhatsApp checkout",
            "Basic analytics",
            "Shophala branding",
        ],
        cta: "Get Started Free",
        ctaStyle: "border border-white/20 hover:bg-white/10 text-white",
    },
    {
        name: "Pro",
        icon: <Rocket size={28} />,
        monthly: 10000,
        yearly: 96000,
        description: "For serious vendors ready to scale.",
        color: "border-white",
        badge: "Most Popular",
        planId: "pro",
        features: [
            "1 Storefront",
            "Unlimited products",
            "WhatsApp checkout",
            "Advanced analytics",
            "Remove Shophala branding",
            "Custom store name",
            "Priority support",
        ],
        cta: "Start Pro",
        ctaStyle: "bg-white text-black hover:scale-105",
    },
    {
        name: "Business",
        icon: <Building2 size={28} />,
        monthly: 25000,
        yearly: 240000,
        description: "For teams and high-volume businesses.",
        color: "border-white/10",
        badge: null,
        planId: "business",
        features: [
            "5 Storefronts",
            "Unlimited products",
            "WhatsApp checkout",
            "Full analytics suite",
            "Remove Shophala branding",
            "Custom domain support",
            "Inventory management",
            "Dedicated support",
        ],
        cta: "Start Business",
        ctaStyle: "border border-white/20 hover:bg-white/10 text-white",
    },
];

function PayButton({ plan, yearly, user }) {
    const amount = yearly ? plan.yearly / 12 : plan.monthly;

    const config = {
        public_key: FLW_PUBLIC_KEY,
        tx_ref: `shophala_${plan.planId}_${Date.now()}`,
        amount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
            email: user?.email || "",
            name: user?.displayName || "Shophala Vendor",
        },
        customizations: {
            title: "Shophala",
            description: `${plan.name} Plan - ${yearly ? "Yearly" : "Monthly"}`,
            logo: "https://shophala.vercel.app/favicon.ico",
        },
    };

    const handleFlutterPayment = useFlutterwave(config);

    return (
        <button
            onClick={() => {
                if (!user) {
                    window.location.href = "/login";
                    return;
                }
                handleFlutterPayment({
                    callback: async (response) => {
                        if (response.status === "successful") {
                            await setDoc(doc(db, "plans", user.uid), {
                                plan: plan.planId,
                                reference: response.transaction_id,
                                email: user.email,
                                amount,
                                yearly,
                                activatedAt: new Date(),
                            });
                            closePaymentModal();
                            alert(`🎉 Payment successful! You're now on the ${plan.name} plan.`);
                            window.location.href = "/dashboard";
                        } else {
                            alert("Payment was not completed. Please try again.");
                            closePaymentModal();
                        }
                    },
                    onClose: () => {
                        console.log("Payment modal closed");
                    },
                });
            }}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition ${plan.ctaStyle}`}
        >
            {plan.cta}
        </button>
    );
}

export default function Pricing() {
    const [yearly, setYearly] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return unsub;
    }, []);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/" className="text-2xl font-bold">Shophala</Link>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-gray-300 hover:text-white transition text-sm">
                        Login
                    </Link>
                    <Link to="/login">
                        <button className="bg-white text-black px-5 py-2.5 rounded-2xl font-semibold text-sm hover:scale-105 transition">
                            Start Selling
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Header */}
            <section className="px-6 md:px-12 py-20 text-center">
                <p className="uppercase tracking-[0.3em] text-gray-500 mb-5 text-sm">Pricing</p>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6">
                    Simple, honest pricing
                </h1>
                <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10">
                    Start free. Upgrade when you're ready. No hidden fees, no surprises.
                </p>

                {/* Toggle */}
                <div className="flex items-center justify-center gap-4">
                    <span className={`text-sm ${!yearly ? "text-white" : "text-gray-500"}`}>Monthly</span>
                    <button
                        onClick={() => setYearly(!yearly)}
                        className={`w-14 h-7 rounded-full transition-colors relative ${yearly ? "bg-white" : "bg-white/20"}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${yearly ? "bg-black left-8" : "bg-white left-1"}`} />
                    </button>
                    <span className={`text-sm ${yearly ? "text-white" : "text-gray-500"}`}>
                        Yearly
                        <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Save 20%</span>
                    </span>
                </div>
            </section>

            {/* Plans */}
            <section className="px-6 md:px-12 pb-24">
                <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative border ${plan.color} rounded-[2rem] p-8 flex flex-col ${plan.badge ? "bg-white/5" : ""}`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full">
                                    {plan.badge}
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-gray-400">{plan.icon}</div>
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                            </div>
                            <div className="mb-4">
                                {plan.monthly === 0 ? (
                                    <p className="text-5xl font-bold">Free</p>
                                ) : (
                                    <div>
                                        <p className="text-5xl font-bold">
                                            ₦{(yearly ? plan.yearly / 12 : plan.monthly).toLocaleString()}
                                            <span className="text-lg text-gray-400 font-normal">/mo</span>
                                        </p>
                                        {yearly && (
                                            <p className="text-gray-500 text-sm mt-1">
                                                ₦{plan.yearly.toLocaleString()} billed yearly
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mb-8">{plan.description}</p>
                            <ul className="flex flex-col gap-3 mb-10 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check size={12} className="text-green-400" />
                                        </div>
                                        <span className="text-gray-300">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            {plan.monthly === 0 ? (
                                <Link to="/login">
                                    <button className={`w-full py-4 rounded-2xl font-semibold text-sm transition ${plan.ctaStyle}`}>
                                        {plan.cta}
                                    </button>
                                </Link>
                            ) : (
                                <PayButton plan={plan} yearly={yearly} user={user} />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="px-6 md:px-12 pb-24 max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                    Frequently asked questions
                </h2>
                <div className="flex flex-col gap-4">
                    {[
                        { q: "Can I upgrade or downgrade anytime?", a: "Yes. You can switch plans at any time. Changes take effect immediately." },
                        { q: "Do I need a website to use Shophala?", a: "No. Shophala gives you a storefront link you can share directly on WhatsApp, Instagram, or anywhere." },
                        { q: "How does WhatsApp checkout work?", a: "When a customer checks out, a pre-filled WhatsApp message with their order details is sent directly to your WhatsApp number." },
                        { q: "Is there a free trial for paid plans?", a: "The Starter plan is free forever. For Pro and Business, contact us on WhatsApp for a trial." },
                        { q: "What payment methods do you accept?", a: "We accept card, bank transfer, and USSD via Flutterwave for Nigerian vendors." },
                    ].map((faq) => (
                        <details key={faq.q} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 group cursor-pointer">
                            <summary className="font-semibold list-none flex items-center justify-between">
                                {faq.q}
                                <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
                            </summary>
                            <p className="text-gray-400 text-sm mt-4 leading-relaxed">{faq.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 md:px-12 pb-24">
                <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[2rem] p-10 sm:p-16 text-center">
                    <h2 className="text-3xl sm:text-5xl font-bold mb-4">Ready to start selling?</h2>
                    <p className="text-gray-400 mb-8 text-lg">Join hundreds of African vendors already using Shophala.</p>
                    <Link to="/login">
                        <button className="bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition text-lg">
                            Create Your Store — It's Free
                        </button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 md:px-12 py-8 text-center text-gray-500 text-sm">
                © 2025 Shophala. Built for African businesses.
            </footer>
        </div>
    );
}