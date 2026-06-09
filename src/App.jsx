import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";
import Storefront from "./pages/Storefront";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Legal from "./pages/Legal";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PromoCodes from "./pages/PromoCodes";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import ProductDetail from "./pages/ProductDetail";
import ResetPassword from "./pages/ResetPassword";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";
import CookieBanner from "./components/CookieBanner";
import SupportButton from "./components/SupportButton";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store/:vendor" element={<Storefront />} />
          <Route path="/store/:vendor/product/:productId" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/promo-codes" element={<ProtectedRoute><PromoCodes /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
        <SupportButton />
      </ErrorBoundary>
    </BrowserRouter>
  );
}