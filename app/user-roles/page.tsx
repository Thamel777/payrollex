"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  UserCheck,
  Shield,
  Key,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Edit,
  Save,
  Lock
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { mockUserRoles } from "@/lib/mockData";

export default function UserRolesPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rolesList = mockUserRoles;

  // Chart data
  const chartData = [
    { name: "Admin", value: 2, color: "#10b981" },
    { name: "HR Manager", value: 8, color: "#3b82f6" },
    { name: "Accounts Officer", value: 5, color: "#8b5cf6" },
    { name: "Department Manager", value: 15, color: "#f59e0b" },
    { name: "Employee", value: 200, color: "#64748b" },
    { name: "Management", value: 3, color: "#ec4899" },
  ];

  // Helper styles for permissions matrix
  const getPermBadgeStyle = (perm: string) => {
    switch (perm) {
      case "full":
        return { style: "bg-emerald-50 text-emerald-800 border-emerald-200", text: "Full Access", dot: "bg-emerald-500" };
      case "write":
        return { style: "bg-blue-50 text-blue-800 border-blue-200", text: "Create/Edit", dot: "bg-blue-500" };
      case "read":
        return { style: "bg-amber-50 text-amber-800 border-amber-200", text: "View Only", dot: "bg-amber-500" };
      case "none":
        return { style: "bg-rose-50 text-rose-800 border-rose-200", text: "No Access", dot: "bg-rose-500" };
      case "na":
      default:
        return { style: "bg-slate-50 text-slate-400 border-slate-200/50", text: "N/A", dot: "bg-slate-300" };
    }
  };

  const matrix = [
    {
      module: "Employee Management",
      permissions: [
        { name: "View Employees", admin: "full", hr: "full", accounts: "read", manager: "read", employee: "read", management: "read" },
        { name: "Add/Edit Employees", admin: "full", hr: "full", accounts: "none", manager: "none", employee: "none", management: "none" },
        { name: "Delete Employees", admin: "full", hr: "write", accounts: "none", manager: "none", employee: "none", management: "none" },
        { name: "Employee Documents", admin: "full", hr: "full", accounts: "read", manager: "none", employee: "read", management: "none" },
      ]
    },
    {
      module: "Attendance Management",
      permissions: [
        { name: "View Attendance Logs", admin: "full", hr: "full", accounts: "read", manager: "full", employee: "read", management: "read" },
        { name: "Approve/Reject Attendance", admin: "full", hr: "full", accounts: "none", manager: "full", employee: "none", management: "none" },
        { name: "Manual Attendance Correction", admin: "full", hr: "write", accounts: "none", manager: "write", employee: "none", management: "none" },
      ]
    },
    {
      module: "Leave Management",
      permissions: [
        { name: "Apply Leave", admin: "full", hr: "full", accounts: "full", manager: "full", employee: "full", management: "full" },
        { name: "Approve/Reject Leave", admin: "full", hr: "full", accounts: "none", manager: "full", employee: "none", management: "none" },
        { name: "View Leave Reports", admin: "full", hr: "full", accounts: "read", manager: "read", employee: "read", management: "read" },
      ]
    },
    {
      module: "Payroll Management",
      permissions: [
        { name: "Process Payroll", admin: "full", hr: "write", accounts: "full", manager: "none", employee: "none", management: "none" },
        { name: "Payroll Approvals", admin: "full", hr: "none", accounts: "none", manager: "none", employee: "none", management: "read" },
        { name: "Generate Payslips", admin: "full", hr: "full", accounts: "full", manager: "none", employee: "none", management: "none" },
        { name: "View Salary Reports", admin: "full", hr: "read", accounts: "full", manager: "none", employee: "none", management: "read" },
      ]
    },
    {
      module: "Reports",
      permissions: [
        { name: "View Dashboard", admin: "full", hr: "full", accounts: "full", manager: "full", employee: "read", management: "full" },
        { name: "View Reports", admin: "full", hr: "full", accounts: "full", manager: "read", employee: "none", management: "full" },
        { name: "Export Reports", admin: "full", hr: "full", accounts: "full", manager: "none", employee: "none", management: "full" },
      ]
    },
    {
      module: "System Settings",
      permissions: [
        { name: "User & Role Management", admin: "full", hr: "none", accounts: "none", manager: "none", employee: "none", management: "none" },
        { name: "System Configuration", admin: "full", hr: "none", accounts: "none", manager: "none", employee: "none", management: "none" },
        { name: "Audit Logs", admin: "full", hr: "read", accounts: "none", manager: "none", employee: "none", management: "none" },
      ]
    }
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Role Counts Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {rolesList.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedRole(item.role)}
            className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all hover:scale-[1.02] ${
              selectedRole === item.role ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10" : "bg-white text-slate-800 border-card-border"
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedRole === item.role ? "text-blue-100" : "text-slate-400"}`}>
              {item.role}
            </span>
            <p className="text-xl font-bold leading-none mt-1.5">{item.count} Users</p>
            <span className={`text-[8px] font-semibold mt-1.5 block ${selectedRole === item.role ? "text-blue-200" : "text-slate-500"}`}>
              Click to view details
            </span>
          </div>
        ))}
      </div>

      {/* Split Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Permission matrix Table - 2 cols */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Role Permissions Matrix</h3>
                <p className="text-xs text-slate-400">Map modules access levels across different authorization roles</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isEditing ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4" /> Save Permissions
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" /> Edit Matrix
                  </>
                )}
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4 min-w-[200px]">Module / Feature</th>
                    <th className={`py-2.5 px-2 text-center ${selectedRole === "Admin" ? "bg-blue-50/20 text-blue-800 font-bold" : ""}`}>Admin</th>
                    <th className={`py-2.5 px-2 text-center ${selectedRole === "HR Manager" ? "bg-blue-50/20 text-blue-800 font-bold" : ""}`}>HR Mgr</th>
                    <th className={`py-2.5 px-2 text-center ${selectedRole === "Accounts Officer" ? "bg-blue-50/20 text-blue-800 font-bold" : ""}`}>Accounts</th>
                    <th className={`py-2.5 px-2 text-center ${selectedRole === "Department Manager" ? "bg-blue-50/20 text-blue-800 font-bold" : ""}`}>Dept Mgr</th>
                    <th className={`py-2.5 px-2 text-center ${selectedRole === "Employee" ? "bg-blue-50/20 text-blue-800 font-bold" : ""}`}>Employee</th>
                    <th className={`py-2.5 px-2 text-center ${selectedRole === "Management" ? "bg-blue-50/20 text-blue-800 font-bold" : ""}`}>Mgmt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrix.map((moduleGroup, gIdx) => (
                    <span key={gIdx} className="table-row-group">
                      {/* Module group Header */}
                      <tr className="bg-slate-50/30">
                        <td colSpan={7} className="py-1.5 px-4 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                          {moduleGroup.module}
                        </td>
                      </tr>
                      {moduleGroup.permissions.map((perm, pIdx) => (
                        <tr key={pIdx} className="hover:bg-slate-50/20">
                          <td className="py-2.5 px-4 font-semibold text-slate-700">{perm.name}</td>
                          
                          {/* Admin */}
                          <td className={`py-2.5 px-2 text-center ${selectedRole === "Admin" ? "bg-blue-50/10" : ""}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.admin).style}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.admin).dot}`}></span>
                              {getPermBadgeStyle(perm.admin).text}
                            </span>
                          </td>
                          
                          {/* HR */}
                          <td className={`py-2.5 px-2 text-center ${selectedRole === "HR Manager" ? "bg-blue-50/10" : ""}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.hr).style}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.hr).dot}`}></span>
                              {getPermBadgeStyle(perm.hr).text}
                            </span>
                          </td>
                          
                          {/* Accounts */}
                          <td className={`py-2.5 px-2 text-center ${selectedRole === "Accounts Officer" ? "bg-blue-50/10" : ""}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.accounts).style}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.accounts).dot}`}></span>
                              {getPermBadgeStyle(perm.accounts).text}
                            </span>
                          </td>
                          
                          {/* Dept Mgr */}
                          <td className={`py-2.5 px-2 text-center ${selectedRole === "Department Manager" ? "bg-blue-50/10" : ""}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.manager).style}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.manager).dot}`}></span>
                              {getPermBadgeStyle(perm.manager).text}
                            </span>
                          </td>
                          
                          {/* Employee */}
                          <td className={`py-2.5 px-2 text-center ${selectedRole === "Employee" ? "bg-blue-50/10" : ""}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.employee).style}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.employee).dot}`}></span>
                              {getPermBadgeStyle(perm.employee).text}
                            </span>
                          </td>
                          
                          {/* Management */}
                          <td className={`py-2.5 px-2 text-center ${selectedRole === "Management" ? "bg-blue-50/10" : ""}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.management).style}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.management).dot}`}></span>
                              {getPermBadgeStyle(perm.management).text}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </span>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column sidebar - description and Pie breakdown */}
        <div className="space-y-6">
          {/* Active Profile Info */}
          <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between min-h-[14rem]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <Lock className="h-5 w-5 text-blue-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-800">Role Details: {selectedRole}</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <p className="text-slate-600 leading-normal font-medium">
                  {rolesList.find(r => r.role === selectedRole)?.desc}
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Security Policies</span>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500 font-medium">
                    <li>Strict role-based access validation.</li>
                    <li>Password changes enforced every 90 days.</li>
                    <li>Automatic timeout on inactivity: 15 minutes.</li>
                    <li>All actions logged in Audit trail logs.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* User role statistic chart */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Role User statistics</h3>
              <p className="text-xs text-slate-400">Total accounts distribution breakdown</p>
            </div>
            <div className="h-44 relative my-2 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Loading chart...</span>
              )}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-800">233</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Total Users</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-slate-600">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
