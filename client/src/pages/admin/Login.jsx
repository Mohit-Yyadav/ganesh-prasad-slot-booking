import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await login(password, email.trim());
      toast.success("Welcome back, Admin.");
      navigate(location.state?.from || "/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-maroon-800 to-maroon-700 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto flex justify-center mb-3">
          <div className="bg-white rounded-xl p-2.5 shadow-sm border border-saffron-100 flex items-center justify-center">
            <img src="/company-logo.png" alt="Codes for Tomorrow" className="h-8 w-auto object-contain" />
          </div>
        </div>
        <h1 className="mt-2 text-center text-xl font-semibold text-maroon-800">
          Admin Portal
        </h1>
        <p className="mt-1 text-center text-xs text-maroon-700/70">
          Codes for Tomorrow · Enter credentials to access
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-maroon-800 uppercase tracking-wide">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon-400" size={18} />
              <input
                id="email"
                type="email"
                required
                autoFocus
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-saffron-200 pl-10 pr-4 text-base text-maroon-900 placeholder:text-gray-400 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500 outline-none"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-maroon-800 uppercase tracking-wide">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-maroon-400" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-saffron-200 pl-10 pr-11 text-base text-maroon-900 placeholder:text-gray-400 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500 outline-none"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 hover:text-maroon-600 p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-maroon-700 text-base font-semibold text-white hover:bg-maroon-800 disabled:opacity-60 transition"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-maroon-600 hover:text-maroon-800 transition font-medium"
          >
            <ArrowLeft size={14} /> Back to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
