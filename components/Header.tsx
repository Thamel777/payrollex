"use client";

import { Bell, Search, ChevronDown, User, LogOut, Settings, Award } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

export default function Header() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // Derive breadcrumbs/page title from route
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Dashboard Overview";
      case "/employees":
        return "Employee Management";
      case "/attendance":
        return "Attendance Management";
      case "/shifts":
        return "Shift & Roster Management";
      case "/leave":
        return "Leave Management";
      case "/overtime":
        return "Overtime Management";
      case "/payroll":
        return "Payroll Processing";
      case "/allowances-deductions":
        return "Allowances & Deductions Management";
      case "/payslips":
        return "Payslip Management";
      case "/biostar-integration":
        return "BioStar 2 Fingerprint Integration";
      case "/user-roles":
        return "User Roles & Permissions";
      case "/profile":
        return "My Profile";
      default:
        return "Payrollex System";
    }
  };



  return (
    <header className="h-16 border-b border-card-border bg-white flex items-center justify-between px-6 sticky top-0 z-40 select-none">
      {/* Page Title & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
          {getPageTitle()}
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 mt-1 sm:mt-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          System Live
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative max-w-xs hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.location.href = `/employees?search=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            placeholder="Search employee or record..."
            className="w-64 pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700 transition-all placeholder-slate-400"
          />
        </div>

        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-800">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Attendance Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 relative transition-colors focus:outline-none"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 flex flex-col gap-0.5 cursor-pointer ${
                        notif.unread ? "bg-blue-50/20" : ""
                      }`}
                    >
                      <p className="text-xs text-slate-700 font-medium leading-normal">
                        {notif.text}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {notif.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-1.5 text-center border-t border-slate-100">
                <Link href="/notifications" className="text-[10px] text-slate-500 font-semibold hover:text-slate-800 cursor-pointer">
                  View all alerts
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors focus:outline-none text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-100 uppercase">
              {user?.email ? user.email.substring(0, 2) : "US"}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.email ? user.email.split("@")[0].toUpperCase() : "User"}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">{role || "Employee"}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">
                  {user?.email ? user.email.split("@")[0].toUpperCase() : "User"}
                </p>
                <p className="text-[9px] text-slate-400 truncate">{user?.email || "user@payrollex.com"}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                My Profile
              </Link>
              <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors">
                <Settings className="h-4 w-4 text-slate-400" />
                System Settings
              </Link>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={logout}
                className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-red-600 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
