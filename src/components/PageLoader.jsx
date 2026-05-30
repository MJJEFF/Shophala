import Logo from "./Logo";

export default function PageLoader({ message = "Loading..." }) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
            <div className="animate-pulse">
                <Logo size={48} />
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/20 border-t-green-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">{message}</p>
            </div>
        </div>
    );
}