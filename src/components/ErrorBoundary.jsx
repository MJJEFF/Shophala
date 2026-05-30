import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("App Error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
                    <p className="text-8xl font-bold text-white/10 mb-4">😵</p>
                    <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
                    <p className="text-gray-400 mb-8 max-w-md">
                        We hit an unexpected error. Don't worry — your store data is safe.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition"
                        >
                            Reload Page
                        </button>
                        <Link to="/">
                            <button className="border border-white/20 px-6 py-3 rounded-2xl hover:bg-white/10 transition">
                                Go Home
                            </button>
                        </Link>
                    </div>
                    <a
                        href="https://wa.me/2348000000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:underline text-sm mt-6">
                    Contact support on WhatsApp
                </a>
        </div >
      );
        }
        return this.props.children;
    }
}