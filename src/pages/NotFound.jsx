import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <nav className="px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/">
                    <Logo size={32} />
                </Link>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-8xl font-bold text-white/10 mb-4">404</p>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">Page not found</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/">
                        <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition">
                            <Home size={18} /> Go Home
                        </button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 border border-white/20 px-6 py-3 rounded-2xl hover:bg-white/10 transition"
                    >
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}