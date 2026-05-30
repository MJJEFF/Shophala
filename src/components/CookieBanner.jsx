import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem("shophala-cookies");
        if (!accepted) setShow(true);
    }, []);

    const accept = () => {
        localStorage.setItem("shophala-cookies", "accepted");
        setShow(false);
    };

    const decline = () => {
        localStorage.setItem("shophala-cookies", "declined");
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 md:px-8 md:py-6">
            <div className="max-w-4xl mx-auto bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
                <p className="text-gray-300 text-sm leading-relaxed">
                    🍪 We use cookies to improve your experience. By using Shophala you agree to our{" "}
                    <Link to="/legal" className="text-green-400 hover:underline">
                        Privacy Policy
                    </Link>.
                </p>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={decline}
                        className="text-gray-400 hover:text-white text-sm transition px-4 py-2"
                    >
                        Decline
                    </button>
                    <button
                        onClick={accept}
                        className="bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-400 transition"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}