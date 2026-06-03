"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Fingerprint, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@payrollex.com");
  const [password, setPassword] = useState("Temp@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled by AuthContext's redirect useEffect —
      // do NOT call router.push() here to avoid duplicate/competing navigations
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email address or password. Please try again.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Temp@123"); // default mock password
  };

  const sampleUsers = [
    { label: "Admin", email: "admin@payrollex.com" },
    { label: "HR Manager", email: "hr@payrollex.com" },
    { label: "Accounts Officer", email: "accounts@payrollex.com" },
    { label: "Dept Manager", email: "dm@payrollex.com" },
    { label: "Employee", email: "employee@payrollex.com" },
    { label: "Management", email: "management@payrollex.com" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white relative overflow-hidden select-none px-4">
      {/* Background blobs for premium glassmorphic effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-xl shadow-blue-500/20 flex items-center justify-center animate-pulse">
            <Fingerprint className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">PayRollEx</h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">Payroll & Attendance Integration Portal</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Welcome Back</h3>
            <p className="text-xs text-slate-400">Sign in with your credentials to access the console.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-semibold leading-normal">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@payrollex.com"
                  className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-bold text-blue-400 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] focus:outline-none disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Console</span>
              )}
            </button>
          </form>

          {/* Quick Select Panel for Developers */}
          <div className="border-t border-slate-700/40 pt-4 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quick Dev Sign-In Roles</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {sampleUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleQuickSelect(user.email)}
                  className={`py-2 px-2.5 rounded-lg border text-left font-semibold transition-all truncate hover:bg-slate-800 ${
                    email === user.email
                      ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                      : "bg-slate-900/30 border-slate-700/60 text-slate-400"
                  }`}
                  title={user.email}
                >
                  {user.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 font-medium">
          © 2026 Payroll & Attendance Management Portal. Secure verification required.
        </p>
      </div>
    </div>
  );
}
