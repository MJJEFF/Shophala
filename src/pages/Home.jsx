import { Link } from "react-router-dom";
import { ShoppingBag, BarChart3, Smartphone, ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <h1 className="text-2xl font-bold">Shophala</h1>

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