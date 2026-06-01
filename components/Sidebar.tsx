"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CalendarCheck,
  Hourglass,
  Calculator,
  Percent,
  FileText,
  Fingerprint,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useAuth, checkPermission } from "@/lib/AuthContext";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

export const isRouteAllowed = (role: string | null, href: string): boolean => {
  return checkPermission(role, href, null);
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role, isAllowed } = useAuth();

  const menuGroups: SidebarGroup[] = [
    {
      category: "MAIN",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Employee Management", href: "/employees", icon: Users },
        { name: "Attendance Management", href: "/attendance", icon: Clock },
        { name: "Shift & Roster", href: "/shifts", icon: CalendarDays },
        { name: "Leave Management", href: "/leave", icon: CalendarCheck },
        { name: "Overtime Management", href: "/overtime", icon: Hourglass },
      ],
    },
    {
      category: "PAYROLL",
      items: [
        { name: "Payroll Processing", href: "/payroll", icon: Calculator },
        { name: "Allowances & Deductions", href: "/allowances-deductions", icon: Percent },
        { name: "Payslip Generation", href: "/payslips", icon: FileText },
      ],
    },
    {
      category: "INTEGRATION",
      items: [
        { name: "BioStar 2 Integration", href: "/biostar-integration", icon: Fingerprint },
      ],
    },
    {
      category: "SETTINGS",
      items: [
        { name: "Users & Roles", href: "/user-roles", icon: Shield },
      ],
    },
  ];

  // Filter groups and items based on role permission
  const filteredGroups = menuGroups
    .map((group) => {
      const items = group.items.filter((item) => isAllowed(item.href));
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`bg-sidebar-bg text-sidebar-fg flex flex-col transition-all duration-300 select-none border-r border-slate-800 ${
        collapsed ? "w-16" : "w-64"
      } min-h-screen relative`}
    >
      {/* Floating Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-5 -right-3 z-50 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white w-6 h-6 rounded-full shadow-md cursor-pointer hover:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 hidden md:flex"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand Header */}
      <div className="h-16 flex items-center border-b border-slate-800 px-3.5 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div className={`flex flex-col transition-all duration-300 origin-left ${collapsed ? "w-0 opacity-0 scale-95 pointer-events-none" : "w-40 opacity-100 scale-100"}`}>
            <span className="font-bold text-lg tracking-tight text-white leading-none whitespace-nowrap">
              Payrollex
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
              Payroll & Attendance
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex-1 py-4 overflow-y-auto space-y-6 transition-all duration-300 ${collapsed ? "px-2" : "px-3"}`}>
        {filteredGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="relative">
              {/* Category Title for Expanded Mode */}
              <h3 className={`px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-300 whitespace-nowrap overflow-hidden origin-left ${
                collapsed ? "h-0 opacity-0 scale-95 pointer-events-none my-0" : "h-4 opacity-100 scale-100 mt-4 first:mt-0 mb-1"
              }`}>
                {group.category}
              </h3>
              
              {/* Group Divider for Collapsed Mode (except first group) */}
              {filteredGroups.indexOf(group) > 0 && (
                <div className={`border-t border-slate-800/80 mx-2 transition-all duration-300 ${
                  collapsed ? "my-4 opacity-100" : "h-0 my-0 opacity-0 overflow-hidden pointer-events-none"
                }`} />
              )}
            </div>

            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center transition-all duration-300 group relative w-full ${
                      collapsed
                        ? "justify-center px-0 py-2.5 rounded-xl"
                        : "gap-3 px-3 py-2.5 rounded-lg"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                    
                    <span className={`truncate text-sm font-medium transition-all duration-300 origin-left whitespace-nowrap ${
                      collapsed ? "w-0 opacity-0 scale-95 pointer-events-none ml-0" : "w-40 opacity-100 scale-100 ml-3"
                    }`}>
                      {item.name}
                    </span>

                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-14 z-50 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap shadow-xl border border-slate-800">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className={`p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-medium transition-all duration-300 origin-bottom ${
        collapsed ? "h-0 py-0 opacity-0 overflow-hidden pointer-events-none border-t-transparent" : "h-14 opacity-100"
      }`}>
        <p className="whitespace-nowrap">© 2026 Payrollex System</p>
        <p className="mt-0.5 whitespace-nowrap">All rights reserved.</p>
      </div>
    </aside>
  );
}
