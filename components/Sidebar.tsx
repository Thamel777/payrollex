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
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 hidden md:block"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-6">
        {menuGroups.map((group) => (
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
          <p>© 2024 Payrollex System</p>
          <p className="mt-0.5">All rights reserved.</p>
        </div>
      )}
    </aside>
  );
}
