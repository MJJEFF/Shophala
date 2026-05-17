import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Boxes,
    Users,
    ShoppingCart,
    BarChart3,
    Settings,
} from "lucide-react";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/10 p-6 hidden md:block">
                <h1 className="text-3xl font-bold mb-12">
                    VendorFlow AI
                </h1>

                <nav className="space-y-3">
                    <Link
                        to="/"
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition"
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>

                    <Link
                        to="/inventory"
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition"
                    >
                        <Boxes size={20} />
                        Inventory
                    </Link>

                    <Link
                        to="/customers"
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition"
                    >
                        <Users size={20} />
                        Customers
                    </Link>

                    <Link
                        to="/orders"
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition"
                    >
                        <ShoppingCart size={20} />
                        Orders
                    </Link>

                    <Link
                        to="/analytics"
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition"
                    >
                        <BarChart3 size={20} />
                        Analytics
                    </Link>

                    <Link
                        to="/settings"
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition"
                    >
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10">
                {children}
            </main>
        </div>
    );
}