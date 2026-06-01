"use client";

import { useState, useEffect, Fragment } from "react";
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
  Lock,
  Loader2
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { mockUserRoles } from "@/lib/mockData";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";

const defaultUsersList = [
  { uid: "admin-default", email: "admin@payrollex.com", name: "System Admin", role: "Admin", status: "Active" },
  { uid: "hr-default", email: "hr@payrollex.com", name: "Kavindi Silva", role: "HR Manager", status: "Active" },
  { uid: "accounts-default", email: "accounts@payrollex.com", name: "Minura Fernando", role: "Accounts Officer", status: "Active" },
  { uid: "dm-default", email: "dm@payrollex.com", name: "Kasun Rajapaksa", role: "Department Manager", status: "Active" },
  { uid: "employee-default", email: "employee@payrollex.com", name: "Nimal Perera", role: "Employee", status: "Active" },
  { uid: "management-default", email: "management@payrollex.com", name: "Management Director", role: "Management", status: "Active" },
  { uid: "employee-2", email: "nimal@payrollex.com", name: "Nimal Kumara", role: "Employee", status: "Active" },
  { uid: "employee-3", email: "sunil@payrollex.com", name: "Sunil Gamage", role: "Employee", status: "Inactive" }
];

export default function UserRolesPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"matrix" | "users">("matrix");
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  const { role, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState(defaultUsersList);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const defaultMatrix = [
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

  const [matrix, setMatrix] = useState(defaultMatrix);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch matrix from Firestore
  useEffect(() => {
    async function loadPermissions() {
      try {
        const docRef = doc(db, "users", "permissions_matrix");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().matrix) {
          setMatrix(docSnap.data().matrix);
        }
      } catch (err) {
        console.error("Error loading permissions from Firestore:", err);
      }
    }
    if (mounted && !authLoading && role === "Admin") {
      loadPermissions();
    }
  }, [mounted, authLoading, role]);

  // Fetch users from Firestore and merge with defaults
  useEffect(() => {
    async function loadUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const fbUsers = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as any[];

        if (fbUsers.length > 0) {
          const merged = defaultUsersList.map(du => {
            const match = fbUsers.find(fu => fu.email?.toLowerCase() === du.email.toLowerCase());
            if (match) {
              return { ...du, uid: match.uid, role: match.role };
            }
            return du;
          });

          fbUsers.forEach(fu => {
            if (!merged.some(m => m.email?.toLowerCase() === fu.email?.toLowerCase())) {
              merged.push({
                uid: fu.uid,
                email: fu.email || "",
                name: fu.email ? fu.email.split("@")[0].toUpperCase() : "Firebase User",
                role: fu.role || "Employee",
                status: "Active"
              });
            }
          });

          setUsers(merged);
        }
      } catch (err) {
        console.error("Error loading users from Firestore:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    
    if (mounted && !authLoading) {
      if (role === "Admin") {
        loadUsers();
      } else {
        setLoadingUsers(false);
      }
    }
  }, [mounted, authLoading, role]);

  const showNotification = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    
    try {
      setSaving(true);
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        role: newRole,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      showNotification(`Role updated to ${newRole} successfully!`);
    } catch (err) {
      console.error("Error saving user role to Firestore:", err);
      showNotification("Failed to save role update to database.", true);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = (moduleIdx: number, permIdx: number, roleKey: string, newValue: string) => {
    setMatrix(prev => {
      const updated = [...prev];
      const mod = { ...updated[moduleIdx] };
      const perms = [...mod.permissions];
      const p = { ...perms[permIdx] };
      (p as any)[roleKey] = newValue;
      perms[permIdx] = p;
      mod.permissions = perms;
      updated[moduleIdx] = mod;
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, "users", "permissions_matrix"), {
        matrix,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
      showNotification("Permissions Matrix saved successfully!");
    } catch (err) {
      console.error("Error saving permissions matrix:", err);
      showNotification("Failed to save permissions to database.", true);
    } finally {
      setSaving(false);
    }
  };

  // Chart data updated dynamically
  const roleColors: Record<string, string> = {
    "Admin": "#10b981",
    "HR Manager": "#3b82f6",
    "Accounts Officer": "#8b5cf6",
    "Department Manager": "#f59e0b",
    "Employee": "#64748b",
    "Management": "#ec4899"
  };

  const getChartData = () => {
    const counts: Record<string, number> = {
      "Admin": 0,
      "HR Manager": 0,
      "Accounts Officer": 0,
      "Department Manager": 0,
      "Employee": 0,
      "Management": 0
    };
    
    users.forEach(u => {
      if (counts[u.role] !== undefined) {
        counts[u.role]++;
      }
    });

    return Object.keys(counts).map(roleName => ({
      name: roleName,
      value: counts[roleName],
      color: roleColors[roleName]
    }));
  };

  const chartData = getChartData();
  const totalUsersCount = users.length;

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

  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8.5 h-8.5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Console Access...</span>
        </div>
      </div>
    );
  }

  // Access Control verification check
  if (role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px] select-none p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-rose-50 p-4 rounded-2xl text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-9 w-9 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Access Control Warning</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Administrator Privileges Required</p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
            <p>
              Your account role is registered as <span className="font-extrabold text-slate-800">{role || "Employee"}</span>. Only users with the <span className="font-bold text-blue-600">Admin</span> system role can view, edit, or configure system permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-fade-in relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl border shadow-xl animate-fade-in transition-all ${
          notification.isError ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {notification.isError ? <AlertTriangle className="h-5 w-5 text-rose-500" /> : <CheckCircle className="h-5 w-5 text-emerald-500" />}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Saving Overlay Spinner */}
      {saving && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-40 flex items-center justify-center rounded-2xl">
          <div className="bg-slate-900/90 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-400" />
            Saving updates to Cloud Firestore...
          </div>
        </div>
      )}

      {/* Role Counts Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {mockUserRoles.map((item, idx) => {
          const count = users.filter(u => u.role === item.role).length;
          return (
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
              <p className="text-xl font-bold leading-none mt-1.5">{count} Users</p>
              <span className={`text-[8px] font-semibold mt-1.5 block ${selectedRole === item.role ? "text-blue-200" : "text-slate-500"}`}>
                Click to view details
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Console Layout: Split into Sidebar Description and Tabbed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Middle Column: Tabbed View (Matrix vs Users) */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header with Navigation Tabs */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Access Control Center</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage permissions matrix and configure user system roles</p>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => { setActiveTab("matrix"); setIsEditing(false); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "matrix" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" /> Matrix
                </button>
                <button
                  onClick={() => { setActiveTab("users"); setIsEditing(false); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "users" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Users
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Permissions Matrix */}
            {activeTab === "matrix" && (
              <div>
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Role Permissions Mapping</span>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSavePermissions();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isEditing ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4" /> Save Mapping
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" /> Edit Matrix
                      </>
                    )}
                  </button>
                </div>

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
                        <Fragment key={gIdx}>
                          <tr className="bg-slate-50/30">
                            <td colSpan={7} className="py-1.5 px-4 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                              {moduleGroup.module}
                            </td>
                          </tr>
                          {moduleGroup.permissions.map((perm, pIdx) => (
                            <tr key={pIdx} className="hover:bg-slate-50/20">
                              <td className="py-2.5 px-4 font-semibold text-slate-700">{perm.name}</td>
                              
                              {/* Admin (Locked - Admin always has Full Access) */}
                              <td className={`py-2.5 px-2 text-center ${selectedRole === "Admin" ? "bg-blue-50/10" : ""}`}>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.admin).style}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.admin).dot}`}></span>
                                  {getPermBadgeStyle(perm.admin).text}
                                </span>
                              </td>
                              
                              {/* HR Manager */}
                              <td className={`py-2.5 px-2 text-center ${selectedRole === "HR Manager" ? "bg-blue-50/10" : ""}`}>
                                {isEditing ? (
                                  <select
                                    value={perm.hr}
                                    onChange={(e) => handlePermissionChange(gIdx, pIdx, "hr", e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="full">Full Access</option>
                                    <option value="write">Create/Edit</option>
                                    <option value="read">View Only</option>
                                    <option value="none">No Access</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.hr).style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.hr).dot}`}></span>
                                    {getPermBadgeStyle(perm.hr).text}
                                  </span>
                                )}
                              </td>
                              
                              {/* Accounts */}
                              <td className={`py-2.5 px-2 text-center ${selectedRole === "Accounts Officer" ? "bg-blue-50/10" : ""}`}>
                                {isEditing ? (
                                  <select
                                    value={perm.accounts}
                                    onChange={(e) => handlePermissionChange(gIdx, pIdx, "accounts", e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="full">Full Access</option>
                                    <option value="write">Create/Edit</option>
                                    <option value="read">View Only</option>
                                    <option value="none">No Access</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.accounts).style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.accounts).dot}`}></span>
                                    {getPermBadgeStyle(perm.accounts).text}
                                  </span>
                                )}
                              </td>
                              
                              {/* Dept Mgr */}
                              <td className={`py-2.5 px-2 text-center ${selectedRole === "Department Manager" ? "bg-blue-50/10" : ""}`}>
                                {isEditing ? (
                                  <select
                                    value={perm.manager}
                                    onChange={(e) => handlePermissionChange(gIdx, pIdx, "manager", e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="full">Full Access</option>
                                    <option value="write">Create/Edit</option>
                                    <option value="read">View Only</option>
                                    <option value="none">No Access</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.manager).style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.manager).dot}`}></span>
                                    {getPermBadgeStyle(perm.manager).text}
                                  </span>
                                )}
                              </td>
                              
                              {/* Employee */}
                              <td className={`py-2.5 px-2 text-center ${selectedRole === "Employee" ? "bg-blue-50/10" : ""}`}>
                                {isEditing ? (
                                  <select
                                    value={perm.employee}
                                    onChange={(e) => handlePermissionChange(gIdx, pIdx, "employee", e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="full">Full Access</option>
                                    <option value="write">Create/Edit</option>
                                    <option value="read">View Only</option>
                                    <option value="none">No Access</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.employee).style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.employee).dot}`}></span>
                                    {getPermBadgeStyle(perm.employee).text}
                                  </span>
                                )}
                              </td>
                              
                              {/* Management */}
                              <td className={`py-2.5 px-2 text-center ${selectedRole === "Management" ? "bg-blue-50/10" : ""}`}>
                                {isEditing ? (
                                  <select
                                    value={perm.management}
                                    onChange={(e) => handlePermissionChange(gIdx, pIdx, "management", e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="full">Full Access</option>
                                    <option value="write">Create/Edit</option>
                                    <option value="read">View Only</option>
                                    <option value="none">No Access</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPermBadgeStyle(perm.management).style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getPermBadgeStyle(perm.management).dot}`}></span>
                                    {getPermBadgeStyle(perm.management).text}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: User Role Assignment */}
            {activeTab === "users" && (
              <div>
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Account Role Allocation</span>
                  <span className="text-[10px] text-slate-400 font-semibold italic">Changes are automatically saved to Firestore</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((userItem) => (
                        <tr key={userItem.uid} className="hover:bg-slate-50/20">
                          <td className="py-3 px-4 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {userItem.name.substring(0, 2)}
                            </div>
                            <span className="font-bold text-slate-700">{userItem.name}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-semibold">{userItem.email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={userItem.role}
                              onChange={(e) => handleUserRoleChange(userItem.uid, e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
                            >
                              <option value="Admin">Admin</option>
                              <option value="HR Manager">HR Manager</option>
                              <option value="Accounts Officer">Accounts Officer</option>
                              <option value="Department Manager">Department Manager</option>
                              <option value="Employee">Employee</option>
                              <option value="Management">Management</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${
                              userItem.status === "Active" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${userItem.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {userItem.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Descriptions & Live Pie Chart Stats */}
        <div className="space-y-6">
          {/* Role Details Panel */}
          <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between min-h-[14rem]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <Lock className="h-5 w-5 text-blue-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-800">Role Policies: {selectedRole}</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <p className="text-slate-600 leading-normal font-medium">
                  {mockUserRoles.find(r => r.role === selectedRole)?.desc}
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

          {/* Dynamic Users Distribution Statistics Chart */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">System Role Allocation</h3>
              <p className="text-xs text-slate-400">Total accounts distribution breakdown</p>
            </div>
            
            <div className="h-44 relative my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-800">{totalUsersCount}</span>
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
