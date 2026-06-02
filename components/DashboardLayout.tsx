"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { loading, user, role, isAllowed } = useAuth();
  
  const isLoginPage = pathname === "/login";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600 font-sans font-semibold text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8.5 h-8.5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading PayRollEx...</span>
        </div>
      </div>
    );
  }

  if (!user && !isLoginPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600 font-sans font-semibold text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8.5 h-8.5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Redirecting to Login...</span>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans w-full flex flex-col">
        {children}
      </div>
    );
  }

  // User is authenticated but role hasn't been resolved yet — show spinner, not Access Denied
  if (user && !role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600 font-sans font-semibold text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8.5 h-8.5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying permissions...</span>
        </div>
      </div>
    );
  }

  // Check if route is allowed for user's role
  const allowed = isAllowed(pathname);

  if (!allowed) {
    return (
      <div className="flex w-full h-screen bg-slate-50 overflow-hidden font-sans">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <Header />

          {/* Content Body */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6 text-center select-none animate-fade-in relative overflow-hidden">
              {/* Background gradient decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex flex-col items-center gap-3">
                <div className="bg-rose-50 p-4 rounded-2xl text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <ShieldAlert className="h-9 w-9" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Access Denied</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Unauthorized Access Attempt</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
                <p>
                  Your current authenticated account role is mapped to <span className="font-extrabold text-slate-800">{role || "Employee"}</span>.
                </p>
                <p className="mt-1">
                  You are not authorized to view this administrative resource:
                  <code className="block bg-slate-100 px-2 py-1.5 rounded-lg font-bold text-rose-600 mt-2 font-mono text-[10px] select-all border border-slate-200">
                    {pathname}
                  </code>
                </p>
              </div>

              <div className="pt-2 flex gap-3 justify-center">
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Header />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
