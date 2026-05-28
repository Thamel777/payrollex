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
import { useAuth } from "@/lib/AuthContext";

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
  if (!role) return false;
  if (role === "Admin") return true; // Admin has full access to all pages

  switch (href) {
    case "/":
      return true; // Everyone can access the Dashboard

    case "/employees":
      // Admin, HR, Accounts Officer, Department Manager, Employee can view
      return ["HR Manager", "Accounts Officer", "Department Manager", "Employee"].includes(role);

    case "/attendance":
      // Admin, HR, Accounts, Dept Manager, Employee, Management can view
      return ["HR Manager", "Accounts Officer", "Department Manager", "Employee", "Management"].includes(role);

    case "/shifts":
      // Admin, HR, Accounts, Dept Manager, Management can view (Employees blocked)
      return ["HR Manager", "Accounts Officer", "Department Manager", "Management"].includes(role);

    case "/leave":
      // Admin, HR, Accounts, Dept Manager, Employee, Management can view
      return ["HR Manager", "Accounts Officer", "Department Manager", "Employee", "Management"].includes(role);

    case "/overtime":
      // Admin, HR, Accounts, Dept Manager can view
      return ["HR Manager", "Accounts Officer", "Department Manager"].includes(role);

    case "/payroll":
      // Admin, HR, Accounts, Management can view (Dept Manager and Employee blocked)
      return ["HR Manager", "Accounts Officer", "Management"].includes(role);

    case "/allowances-deductions":
      // Admin, HR, Accounts can view
      return ["HR Manager", "Accounts Officer"].includes(role);

    case "/payslips":
      // Admin, HR, Accounts, Employee can view (Dept Manager, Management blocked)
      return ["HR Manager", "Accounts Officer", "Employee"].includes(role);

    case "/biostar-integration":
      // Admin, HR can edit, Accounts and Dept Manager can view integration logs
      return ["HR Manager", "Accounts Officer", "Department Manager"].includes(role);

    case "/user-roles":
      return false; // Handled by Admin fallback at top

    default:
      return false;
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();

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
      const items = group.items.filter((item) => isRouteAllowed(role, item.href));
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`bg-sidebar-bg text-sidebar-fg flex flex-col transition-all duration-300 select-none border-r border-slate-800 ${
        collapsed ? "w-20" : "w-64"
      } min-h-screen relative`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-blue-600 p-2 rounded-lg text-white flex items-center justify-center shrink-0">
            <Fingerprint className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white leading-none">
                Payrollex
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Payroll & Attendance
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 hidden md:block cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {!collapsed ? (
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {group.category}
              </h3>
            ) : (
              <div className="h-4 border-t border-slate-800 my-2 mx-2" />
            )}

            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                    {!collapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-16 z-50 bg-slate-950 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
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
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-medium">
          <p>© 2026 Payrollex System</p>
          <p className="mt-0.5">All rights reserved.</p>
        </div>
      )}
    </aside>
  );
}
