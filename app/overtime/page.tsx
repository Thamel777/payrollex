"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Hourglass,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  DollarSign,
  Settings,
  Edit,
  Users
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { mockOvertimeRequests, OvertimeRequest, Employee } from "@/lib/mockData";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import Portal from "@/components/Portal";

export default function OvertimePage() {
  const { employeeId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState("Nimal Perera");
  const [formDept, setFormDept] = useState("IT Department");
  const [formType, setFormType] = useState("Normal OT");
  const [formDate, setFormDate] = useState("2024-05-20");
  const [formHours, setFormHours] = useState(3);
  const [formRateType, setFormRateType] = useState("Hourly Rate");

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void | Promise<void>;
    type: "warning" | "info" | "danger" | "success";
    position?: { top: number; left: number };
  }>({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: () => {},
    type: "info"
  });

  // Load employees from Firestore
  useEffect(() => {
    setMounted(true);

    const unsub = onSnapshot(collection(db, "employees"), (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Employee);
      });
      setEmployees(list);
      setDbLoading(false);
    });

    return () => unsub();
  }, []);

  // Seeding default overtime requests if not present in Firestore
  useEffect(() => {
    if (employees.length > 0) {
      const seedDefaultOvertime = async () => {
        for (const emp of employees) {
          if (!emp.overtimeRequests) {
            const empMockOvertime: Record<string, any> = {};
            mockOvertimeRequests.forEach(req => {
              if (req.name === emp.name) {
                empMockOvertime[req.id] = req;
              }
            });
            try {
              await updateDoc(doc(db, "employees", emp.id), {
                overtimeRequests: empMockOvertime
              });
            } catch (err) {
              console.error("Failed to seed overtime data for " + emp.name, err);
            }
          }
        }
      };
      seedDefaultOvertime();
    }
  }, [employees]);

  // Determine active applying employee info based on form selection
  const selectedEmployeeDoc = useMemo(() => {
    return employees.find(e => e.name === formName) || (employees.length > 0 ? employees[0] : null);
  }, [employees, formName]);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    type: "warning" | "info" | "danger" | "success" = "info",
    confirmText: string = "Confirm",
    cancelText: string = "Cancel",
    event?: any
  ) => {
    let position = undefined;
    if (event && event.currentTarget) {
      try {
        const rect = event.currentTarget.getBoundingClientRect();
        const buttonWidth = rect.width;
        const modalWidth = 320;
        
        let left = rect.left + buttonWidth / 2 - modalWidth / 2;
        let top = rect.bottom + 8;
        
        if (left < 16) left = 16;
        if (left + modalWidth > window.innerWidth - 16) {
          left = window.innerWidth - modalWidth - 16;
        }
        
        const modalHeight = 180;
        if (top + modalHeight > window.innerHeight - 16) {
          top = rect.top - modalHeight - 8;
        }
        if (top < 16) top = rect.bottom + 8;
        
        position = { top, left };
      } catch (err) {
        console.error("Failed to calculate popup position:", err);
      }
    }

    setConfirmModal({
      show: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type,
      position
    });
  };

  const showAlert = (
    title: string,
    message: string,
    type: "warning" | "info" | "danger" | "success" = "info",
    event?: any
  ) => {
    let position = undefined;
    if (event && event.currentTarget) {
      try {
        let targetElement = event.currentTarget;
        if (targetElement.tagName === "FORM") {
          const submitBtn = targetElement.querySelector('button[type="submit"]') || targetElement.querySelector('button');
          if (submitBtn) {
            targetElement = submitBtn;
          }
        }
        const rect = targetElement.getBoundingClientRect();
        const buttonWidth = rect.width;
        const modalWidth = 320;
        
        let left = rect.left + buttonWidth / 2 - modalWidth / 2;
        let top = rect.bottom + 8;
        
        if (left < 16) left = 16;
        if (left + modalWidth > window.innerWidth - 16) {
          left = window.innerWidth - modalWidth - 16;
        }
        
        const modalHeight = 150;
        if (top + modalHeight > window.innerHeight - 16) {
          top = rect.top - modalHeight - 8;
        }
        if (top < 16) top = rect.bottom + 8;
        
        position = { top, left };
      } catch {
        // Fallback to center
      }
    }

    setConfirmModal({
      show: true,
      title,
      message,
      confirmText: "OK",
      cancelText: "",
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type,
      position
    });
  };

  // Compile flat overtime requests list
  const requests = useMemo(() => {
    const list: (OvertimeRequest & { empId: string })[] = [];
    employees.forEach(emp => {
      if (emp.overtimeRequests) {
        Object.values(emp.overtimeRequests).forEach((req: any) => {
          list.push({
            ...req,
            empId: emp.id,
            name: emp.name, // Ensure we have the name
            department: emp.department // Ensure we have the department
          });
        });
      }
    });

    if (list.length === 0 && dbLoading) {
      return [];
    }

    // Sort desc by date
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [employees, dbLoading]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateAmount = formType === "Normal OT" ? 1200 : formType === "Weekend OT" ? 1500 : formType === "Night OT" ? 1800 : 2000;
    const amount = formHours * rateAmount;

    const totalRequestsCount = employees.reduce((acc, emp) => acc + (emp.overtimeRequests ? Object.keys(emp.overtimeRequests).length : 0), 0);
    const newId = `OT00${totalRequestsCount + 1}`;

    const freshRequest: OvertimeRequest = {
      id: newId,
      name: formName,
      department: formDept,
      type: formType,
      date: formDate,
      time: "06:00 PM - 09:00 PM",
      hours: formHours,
      rateType: formRateType,
      amount,
      status: "Pending"
    };

    const targetEmpId = selectedEmployeeDoc?.id || "EMP001";

    try {
      await updateDoc(doc(db, "employees", targetEmpId), {
        [`overtimeRequests.${newId}`]: freshRequest
      });
      setShowAddModal(false);
      showAlert("Success", "Overtime request submitted successfully!", "success", e);
    } catch (err: any) {
      showAlert("Error", "Failed to submit overtime request: " + err.message, "danger", e);
    }
  };

  const handleAction = async (empId: string, requestId: string, action: "Approved" | "Rejected") => {
    try {
      await updateDoc(doc(db, "employees", empId), {
        [`overtimeRequests.${requestId}.status`]: action,
        [`overtimeRequests.${requestId}.processedBy`]: employeeId || "Admin",
        [`overtimeRequests.${requestId}.processedAt`]: new Date().toISOString().split("T")[0]
      });
    } catch (err: any) {
      console.error("Error updating OT action:", err);
    }
  };

  const handleActionConfirm = (empId: string, requestId: string, action: "Approved" | "Rejected", event: React.MouseEvent) => {
    showConfirm(
      `Confirm Overtime ${action === "Approved" ? "Approval" : "Rejection"}`,
      `Are you sure you want to ${action.toLowerCase()} this overtime request?`,
      () => handleAction(empId, requestId, action),
      action === "Approved" ? "success" : "danger",
      action === "Approved" ? "Approve" : "Reject",
      "Cancel",
      event
    );
  };

  // KPI calculations
  const stats = useMemo(() => {
    let totalHours = 0;
    let approvedHours = 0;
    let pendingHours = 0;
    let approvedCost = 0;

    requests.forEach(r => {
      totalHours += r.hours;
      if (r.status === "Approved") {
        approvedHours += r.hours;
        approvedCost += r.amount;
      } else if (r.status === "Pending") {
        pendingHours += r.hours;
      }
    });

    const activeEmployeesCount = Array.from(new Set(requests.map(r => r.name))).length;

    return {
      totalHours: `${totalHours}h 00m`,
      approvedHours: `${approvedHours}h 00m`,
      pendingHours: `${pendingHours}h 00m`,
      approvedCost: `LKR ${approvedCost.toLocaleString()}`,
      activeEmployeesCount
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "All" || r.type === typeFilter;
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, searchTerm, typeFilter, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Chart data
  const typeData = useMemo(() => {
    const counts = { "Normal OT": 0, "Weekend OT": 0, "Night OT": 0, "Holiday OT": 0, "Other": 0 };
    requests.forEach(r => {
      if (r.status === "Approved") {
        if (r.type in counts) counts[r.type as keyof typeof counts] += r.hours;
        else counts["Other"] += r.hours;
      }
    });
    return [
      { name: "Normal OT", value: counts["Normal OT"] || 102, color: "#3b82f6" },
      { name: "Weekend OT", value: counts["Weekend OT"] || 60, color: "#10b981" },
      { name: "Night OT", value: counts["Night OT"] || 45, color: "#8b5cf6" },
      { name: "Holiday OT", value: counts["Holiday OT"] || 34, color: "#f59e0b" },
      { name: "Other", value: counts["Other"] || 15, color: "#64748b" },
    ];
  }, [requests]);

  const trendData = [
    { date: "May 01", Hours: 24 },
    { date: "May 06", Hours: 48 },
    { date: "May 11", Hours: 32 },
    { date: "May 16", Hours: 64 },
    { date: "May 21", Hours: 52 },
    { date: "May 26", Hours: 36 },
  ];

  const policies = [
    { type: "Normal OT", desc: "Weekdays basic overtime", rate: "1.5x Hourly Rate", days: "Mon - Fri" },
    { type: "Weekend OT", desc: "Saturday and Sunday overtime", rate: "2.0x Hourly Rate", days: "Sat - Sun" },
    { type: "Holiday OT", desc: "Declared public holiday duties", rate: "2.5x Hourly Rate", days: "All Holidays" },
    { type: "Night OT", desc: "Shift extension (10 PM - 6 AM)", rate: "1.75x Hourly Rate", days: "All Days" },
    { type: "Fixed Rate", desc: "Hourly flat payment threshold", rate: "LKR 500 / hr", days: "All Days" },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800";
      case "Rejected":
        return "bg-rose-100 text-rose-800";
      case "Pending":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total OT Hours</span>
          <p className="text-xl font-bold text-slate-800 leading-none mt-1">{stats.totalHours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved OT Hours</span>
          <p className="text-xl font-bold text-emerald-600 leading-none mt-1">{stats.approvedHours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending OT Hours</span>
          <p className="text-xl font-bold text-amber-600 leading-none mt-1">{stats.pendingHours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OT Cost (Approved)</span>
          <p className="text-xl font-bold text-indigo-600 leading-none mt-1">{stats.approvedCost}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employees Mapped</span>
          <p className="text-xl font-bold text-slate-800 leading-none mt-1">{stats.activeEmployeesCount} Members</p>
        </div>
      </div>

      {/* Main Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Overtime Request Logs - 2 cols */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Filters */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search employee, department..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50 focus:bg-white"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  <option value="All">All OT Types</option>
                  <option value="Normal OT">Normal OT</option>
                  <option value="Weekend OT">Weekend OT</option>
                  <option value="Night OT">Night OT</option>
                  <option value="Holiday OT">Holiday OT</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer bg-white">
                  <Download className="h-4 w-4" /> Export
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add OT Request
                </button>
              </div>
            </div>

            {/* OT Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">OT Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Hours</th>
                    <th className="py-3 px-4">Rate Basis</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{req.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{req.department}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-600">{req.type}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{req.date}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{req.hours}h</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{req.rateType}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">LKR {req.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusStyle(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === "Pending" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => handleActionConfirm(req.empId, req.id, "Approved", e)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => handleActionConfirm(req.empId, req.id, "Rejected", e)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[10px] rounded-md transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        No overtime logs found matching filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>
              Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} logs
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Prev
              </button>
              <button className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md">{currentPage}</button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * itemsPerPage >= filteredRequests.length}
                className="px-2 py-0.5 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right column widgets */}
        <div className="space-y-6">
          {/* OT Type summary Donut */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">OT Category Distribution</h3>
              <p className="text-xs text-slate-400">Total hours processed breakdown</p>
            </div>
            <div className="h-44 relative my-2 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                      {typeData.map((entry, index) => (
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
                <span className="text-xl font-bold text-slate-800">256h</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Total Hours</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-slate-600">
              {typeData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}: {item.value}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* OT Hours Trend */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Hours Trend</h3>
              <p className="text-xs text-slate-400">Continuous monitoring of overtime load</p>
            </div>
            <div className="h-44 mt-4">
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: "9px", fill: "#94a3b8" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "9px", fill: "#94a3b8" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Hours" stroke="#8b5cf6" strokeWidth={2.5} dot={{ stroke: '#8b5cf6', strokeWidth: 1, r: 2 }} name="Hours" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Loading trend...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rules Policy & Department summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OT Policy table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Overtime Policy Guidelines</h3>
              <p className="text-xs text-slate-400">Rate factors defined by company rules</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">OT Type</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Rate Factor</th>
                    <th className="py-2.5 px-4">Applicable Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {policies.map((pol, index) => (
                    <tr key={index} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-bold text-slate-700">{pol.type}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{pol.desc}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">{pol.rate}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{pol.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Department Wise Summary */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Department wise Summary</h3>
              <p className="text-xs text-slate-400">Overtime expenditures overview</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2 px-4">Department</th>
                    <th className="py-2.5 px-3 text-center">Hours</th>
                    <th className="py-2.5 px-3 text-right">Cost (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-700">IT Department</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">68h 30m</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">68,750</td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-700">HR Department</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">45h 00m</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">42,300</td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-700">Operations Dept</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">38h 15m</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">38,250</td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                    <td className="py-2.5 px-4 text-slate-800 uppercase tracking-wider text-[10px]">Total</td>
                    <td className="py-2.5 px-3 text-center text-slate-800">241h 00m</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">234,700</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add OT Request Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-blue-600" />
                Add Overtime Request
              </h3>
            </div>
            <form onSubmit={handleAddRequest} className="p-6 space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</label>
                  <select
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      // Auto department assign
                      if (e.target.value === "Kavindi Silva") setFormDept("HR Department");
                      else if (e.target.value === "Minura Fernando") setFormDept("Finance Department");
                      else setFormDept("IT Department");
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="Nimal Perera">Nimal Perera</option>
                    <option value="Kavindi Silva">Kavindi Silva</option>
                    <option value="Minura Fernando">Minura Fernando</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OT Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="Normal OT">Normal OT (1.5x)</option>
                    <option value="Weekend OT">Weekend OT (2.0x)</option>
                    <option value="Night OT">Night OT (1.75x)</option>
                    <option value="Holiday OT">Holiday OT (2.5x)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours</label>
                    <input
                      type="number"
                      value={formHours}
                      onChange={(e) => setFormHours(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10"
                >
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <Portal>
          <div 
            className="fixed inset-0 z-[100] bg-black/15 backdrop-blur-[1px] select-none p-4 flex items-center justify-center animate-fade-in-fast"
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-[320px] shadow-2xl border border-slate-100 p-5 space-y-4 z-[101] animate-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-full shrink-0 ${
                confirmModal.type === "danger" 
                  ? "bg-rose-50 text-rose-600 border border-rose-100" 
                  : confirmModal.type === "warning"
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : confirmModal.type === "success"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}>
                {confirmModal.type === "danger" ? (
                  <XCircle className="h-5 w-5" />
                ) : confirmModal.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : confirmModal.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-xs leading-normal">
                  {confirmModal.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {confirmModal.cancelText && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-3.5 py-1.5 text-white font-bold text-[10px] rounded-lg transition-all shadow-md cursor-pointer ${
                  confirmModal.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                    : confirmModal.type === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/10"
                    : confirmModal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Loading Overlay */}
      {dbLoading && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-[200]">
          <div className="bg-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-600">Connecting to Firestore...</span>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
