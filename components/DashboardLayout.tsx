"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  
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

  return (
    <div className="flex w-full min-h-screen bg-slate-50 overflow-hidden font-sans">
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
