import { Link } from "react-router-dom";
import { ShoppingBag, BarChart3, Smartphone, ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "../components/Logo";

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/">
                    <Logo size={36} />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
                    <Link to="/login" className="text-gray-300 hover:text-white transition">Login</Link>
                    <Link to="/login">
                        <button className="bg-white text-black px-5 py-3 rounded-2xl font-semibold hover:scale-105 transition">
                            Start Selling
                        </button>
                    </Link>
                </div>

                {/* Mobile Hamburger */}
                <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden flex flex-col gap-4 px-6 py-6 border-b border-white/10 bg-black">
                    <Link to="/pricing" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition text-lg">Pricing</Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition text-lg">Login</Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                        <button className="bg-white text-black px-5 py-3 rounded-2xl font-semibold w-full">
                            Start Selling
                        </button>
                    </Link>
                </div>
            )}

            {/* Hero */}
            <section className="px-6 md:px-12 py-16 md:py-24">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left */}
                    <div>
                        <p className="uppercase tracking-[0.3em] text-gray-500 mb-6 text-sm">
                            Commerce for African Businesses
                        </p>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-8">
                            Sell smarter with
                            <span className="text-green-400"> Shophala</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-10">
                            Create a storefront, manage products, track orders,
                            and receive customer purchases directly through WhatsApp.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/login">
                                <button className="bg-white text-black px-7 py-4 rounded-2xl font-semibold hover:scale-105 transition flex items-center justify-center gap-2 w-full sm:w-auto">
                                    Launch Store <ArrowRight size={20} />
                                </button>
                            </Link>
                            <button
                                onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
                                className="border border-white/20 px-7 py-4 rounded-2xl hover:bg-white/10 transition w-full sm:w-auto text-center"
                            >
                                See Features
                            </button>
                        </div>
                    </div>

                    {/* Right — Dashboard Mockup */}
                    <div className="relative mt-10 lg:mt-0">
                        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl sm:text-2xl font-bold">Shophala Dashboard</h2>
                                <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm">
                                    Online
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-5 rounded-2xl">
                                    <p className="text-gray-400 mb-2 text-sm">Revenue</p>
                                    <h3 className="text-2xl sm:text-3xl font-bold">₦2.4M</h3>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl">
                                    <p className="text-gray-400 mb-2 text-sm">Orders</p>
                                    <h3 className="text-2xl sm:text-3xl font-bold">483</h3>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5">
                                <p className="text-gray-400 mb-3 text-sm">Recent Order</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Sneakers</h3>
                                        <p className="text-gray-500 text-sm">WhatsApp Order</p>
                                    </div>
                                    <p className="text-green-400 font-bold">₦85,000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="px-6 md:px-12 pb-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="uppercase tracking-[0.3em] text-gray-500 mb-5 text-sm">Features</p>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold">Everything vendors need</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            { icon: <ShoppingBag size={36} />, title: "Product Management", desc: "Upload products, manage inventory, and organize your storefront easily." },
                            { icon: <BarChart3 size={36} />, title: "Sales Analytics", desc: "Track revenue, customer growth, and order performance in real time." },
                            { icon: <Smartphone size={36} />, title: "WhatsApp Checkout", desc: "Customers place orders directly through WhatsApp for faster conversion." },
                        ].map((f) => (
                            <div key={f.title} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 transition">
                                <div className="mb-6">{f.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="px-6 md:px-12 pb-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="uppercase tracking-[0.3em] text-gray-500 mb-5 text-sm">Testimonials</p>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold">Vendors love Shophala</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Amaka Obi",
                                role: "Fashion Vendor, Lagos",
                                avatar: "A",
                                text: "Before Shophala I was sending my catalogue manually to every customer. Now they just click my link and order on WhatsApp. My sales doubled in 2 weeks!",
                                stars: 5,
                            },
                            {
                                name: "Chukwudi Eze",
                                role: "Electronics Seller, Abuja",
                                avatar: "C",
                                text: "Very easy to set up. I added all my products in 30 minutes and shared my store link on my WhatsApp status. I got 3 orders the same day.",
                                stars: 5,
                            },
                            {
                                name: "Fatima Aliyu",
                                role: "Food Vendor, Kano",
                                avatar: "F",
                                text: "My customers used to forget what they ordered. Now everything comes in a WhatsApp message automatically. Shophala is a game changer for my business.",
                                stars: 5,
                            },
                            {
                                name: "Tunde Adeyemi",
                                role: "Shoe Vendor, Port Harcourt",
                                avatar: "T",
                                text: "I was skeptical at first but after setting up my store I realized this is exactly what Nigerian vendors need. Professional and affordable.",
                                stars: 5,
                            },
                            {
                                name: "Ngozi Nwosu",
                                role: "Cosmetics Seller, Enugu",
                                avatar: "N",
                                text: "The promo code feature alone is worth it. I run discount campaigns and track everything. My customers think I'm running a big company now!",
                                stars: 5,
                            },
                            {
                                name: "Ibrahim Musa",
                                role: "Groceries Vendor, Kaduna",
                                avatar: "I",
                                text: "Setup took less than 5 minutes. I had my store link ready to share the same day. The free plan is already better than anything I've tried before.",
                                stars: 5,
                            },
                        ].map((t) => (
                            <div
                                key={t.name}
                                className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 transition flex flex-col gap-4"
                            >
                                {/* Stars */}
                                <div className="flex gap-1">
                                    {[...Array(t.stars)].map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-lg">★</span>
                                    ))}
                                </div>
                                {/* Text */}
                                <p className="text-gray-300 leading-relaxed text-sm flex-1">
                                    "{t.text}"
                                </p>
                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{t.name}</p>
                                        <p className="text-gray-500 text-xs">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="px-6 md:px-12 pb-24 max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <p className="uppercase tracking-[0.3em] text-gray-500 mb-5 text-sm">FAQ</p>
                    <h2 className="text-3xl sm:text-4xl font-bold">Frequently asked questions</h2>
                </div>
                <div className="flex flex-col gap-4">
                    {[
                        {
                            q: "How do I create my store?",
                            a: "Sign up with your email or Google account, add your products, and copy your store link. The whole process takes less than 5 minutes.",
                        },
                        {
                            q: "Do my customers need to download an app?",
                            a: "No. Your customers just click your store link in their browser, browse your products, and order directly through WhatsApp. No app download needed.",
                        },
                        {
                            q: "How do I receive orders?",
                            a: "When a customer checks out, a pre-filled WhatsApp message with their full order details is sent directly to your WhatsApp number automatically.",
                        },
                        {
                            q: "Is Shophala free?",
                            a: "Yes! The Starter plan is free forever with up to 10 products. Upgrade to Pro for unlimited products and advanced features.",
                        },
                        {
                            q: "Can I use Shophala on my phone?",
                            a: "Absolutely. Shophala is fully mobile-friendly and works perfectly on any smartphone or tablet.",
                        },
                        {
                            q: "How do I get paid?",
                            a: "You receive payment directly from your customers however you prefer — bank transfer, cash, POS, or mobile money. Shophala handles the ordering, you handle the payment.",
                        },
                        {
                            q: "Can I create discount codes for my customers?",
                            a: "Yes! Pro and Business plan vendors can create unlimited promo codes with percentage or fixed discounts.",
                        },
                        {
                            q: "What if I have more questions?",
                            a: "Chat with us on WhatsApp anytime. We typically respond within a few hours.",
                        },
                    ].map((faq) => (
                        <details
                            key={faq.q}
                            className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 group cursor-pointer"
                        >
                            <summary className="font-semibold list-none flex items-center justify-between text-sm sm:text-base">
                                {faq.q}
                                <span className="text-gray-400 group-open:rotate-45 transition-transform duration-200 text-xl flex-shrink-0 ml-4">
                                    +
                                </span>
                            </summary>
                            <p className="text-gray-400 text-sm mt-4 leading-relaxed">{faq.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 md:px-12 py-8 text-center text-gray-500 text-sm">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <span>© 2025 Shophala. Built for African businesses.</span>
                    <Link to="/legal" className="hover:text-white transition">Terms & Privacy</Link>
                </div>
            </footer>
        </div>
    );
}