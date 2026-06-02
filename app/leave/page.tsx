"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Plus,
  Search,
  Download,
  AlertCircle,
  AlertTriangle,
  FileText,
  BookmarkCheck,
  Send,
  Trash2,
  Users
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { mockLeaveRequests, LeaveRequest, Employee } from "@/lib/mockData";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import Portal from "@/components/Portal";

export default function LeavePage() {
  const { employeeId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Form states
  const [formLeaveType, setFormLeaveType] = useState("Annual Leave");
  const [formFromDate, setFormFromDate] = useState("2024-05-21");
  const [formToDate, setFormToDate] = useState("2024-05-23");
  const [formDuration, setFormDuration] = useState("3 Days");
  const [formHalfDay, setFormHalfDay] = useState("Full Day");
  const [formReason, setFormReason] = useState("");

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

  // Seeding default leaves and balances if not present in Firestore
  useEffect(() => {
    if (employees.length > 0) {
      const seedDefaultLeaves = async () => {
        for (const emp of employees) {
          if (!emp.leaveBalances || !emp.leaveRequests) {
            const initialBalances = {
              annual: 14.0,
              casual: 7.0,
              medical: 14.0,
              special: 5.0
            };
            const empMockLeaves: Record<string, any> = {};
            mockLeaveRequests.forEach(req => {
              if (req.empName === emp.name) {
                empMockLeaves[req.id] = req;
              }
            });
            try {
              await updateDoc(doc(db, "employees", emp.id), {
                leaveBalances: emp.leaveBalances || initialBalances,
                leaveRequests: emp.leaveRequests || empMockLeaves
              });
            } catch (err) {
              console.error("Failed to seed leave data for " + emp.name, err);
            }
          }
        }
      };
      seedDefaultLeaves();
    }
  }, [employees]);

  // Determine active applying employee
  const activeEmpId = employeeId || (employees.length > 0 ? employees[0].id : "EMP001");
  const activeEmpName = (employees.find(e => e.id === activeEmpId)?.name) || "Admin User";
  const activeEmpDept = (employees.find(e => e.id === activeEmpId)?.department) || "Management";

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

  // Compile flat leave requests list
  const requests = useMemo(() => {
    const list: (LeaveRequest & { empId: string })[] = [];
    employees.forEach(emp => {
      if (emp.leaveRequests) {
        Object.values(emp.leaveRequests).forEach((req: any) => {
          list.push({
            ...req,
            empId: emp.id
          });
        });
      }
    });

    if (list.length === 0 && dbLoading) {
      return mockLeaveRequests.map(r => ({ ...r, empId: "EMP001" }));
    }

    // Sort desc by appliedOn
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [employees, dbLoading]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReason) {
      showAlert("Validation Error", "Please specify a reason", "warning", e);
      return;
    }

    const totalLeaveCount = employees.reduce((acc, emp) => acc + (emp.leaveRequests ? Object.keys(emp.leaveRequests).length : 0), 0);
    const newId = `LV00${totalLeaveCount + 1}`;

    const freshLeave = {
      id: newId,
      empName: activeEmpName,
      department: activeEmpDept,
      leaveType: formLeaveType,
      fromDate: formFromDate,
      toDate: formToDate,
      duration: formDuration,
      reason: formReason,
      status: "Pending" as const,
      appliedOn: new Date().toISOString().split("T")[0]
    };

    try {
      await updateDoc(doc(db, "employees", activeEmpId), {
        [`leaveRequests.${newId}`]: freshLeave
      });
      setFormReason("");
      showAlert("Success", "Leave request submitted successfully!", "success", e);
    } catch (err: any) {
      showAlert("Error", "Failed to submit leave request: " + err.message, "danger", e);
    }
  };

  const handleApproval = async (empId: string, requestId: string, action: "Approved" | "Rejected") => {
    try {
      const emp = employees.find(e => e.id === empId);
      if (!emp || !emp.leaveRequests || !emp.leaveRequests[requestId]) return;

      const req = emp.leaveRequests[requestId];
      const leaveType = req.leaveType;
      const durationDays = parseFloat(req.duration.split(" ")[0]) || 1.0;

      const updatePayload: Record<string, any> = {
        [`leaveRequests.${requestId}.status`]: action,
        [`leaveRequests.${requestId}.processedBy`]: employeeId || "Admin",
        [`leaveRequests.${requestId}.processedAt`]: new Date().toISOString().split("T")[0]
      };

      if (action === "Approved" && emp.leaveBalances) {
        let balanceKey = "annual";
        if (leaveType.includes("Casual")) balanceKey = "casual";
        else if (leaveType.includes("Medical")) balanceKey = "medical";
        else if (leaveType.includes("Special")) balanceKey = "special";

        const currentBalance = (emp.leaveBalances as any)[balanceKey] || 0;
        const newBalance = Math.max(0, currentBalance - durationDays);
        updatePayload[`leaveBalances.${balanceKey}`] = newBalance;
      }

      await updateDoc(doc(db, "employees", empId), updatePayload);
    } catch (err: any) {
      console.error("Error updating approval:", err);
    }
  };

  const handleApprovalConfirm = (empId: string, requestId: string, action: "Approved" | "Rejected", event: React.MouseEvent) => {
    showConfirm(
      `Confirm Leave ${action === "Approved" ? "Approval" : "Rejection"}`,
      `Are you sure you want to ${action.toLowerCase()} this leave request?`,
      () => handleApproval(empId, requestId, action),
      action === "Approved" ? "success" : "danger",
      action === "Approved" ? "Approve" : "Reject",
      "Cancel",
      event
    );
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === "Pending").length;
    const approved = requests.filter(r => r.status === "Approved").length;
    const rejected = requests.filter(r => r.status === "Rejected").length;
    
    // Accumulate balances of active user (or sum all if admin)
    const emp = employees.find(e => e.id === activeEmpId);
    const available = emp && emp.leaveBalances
      ? Object.values(emp.leaveBalances).reduce((a, b) => a + b, 0)
      : 142.5;

    const totalTaken = approved * 1.5; // simple mock scaling

    return {
      total: requests.length,
      pending,
      approved,
      rejected,
      totalTaken: totalTaken || 87.5,
      available
    };
  }, [requests, employees, activeEmpId]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = req.empName.toLowerCase().includes(searchTerm.toLowerCase()) || req.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Chart data
  const balanceData = useMemo(() => {
    const emp = employees.find(e => e.id === activeEmpId);
    if (emp && emp.leaveBalances) {
      return [
        { name: "Annual Leave", value: emp.leaveBalances.annual || 0, color: "#3b82f6" },
        { name: "Casual Leave", value: emp.leaveBalances.casual || 0, color: "#10b981" },
        { name: "Medical Leave", value: emp.leaveBalances.medical || 0, color: "#ef4444" },
        { name: "Special Leave", value: emp.leaveBalances.special || 0, color: "#f59e0b" },
      ];
    }
    return [
      { name: "Annual Leave", value: 68.5, color: "#3b82f6" },
      { name: "Casual Leave", value: 25.0, color: "#10b981" },
      { name: "Medical Leave", value: 15.0, color: "#ef4444" },
      { name: "Special Leave", value: 12.0, color: "#f59e0b" },
      { name: "Other Leave", value: 22.0, color: "#6366f1" },
    ];
  }, [employees, activeEmpId]);

  const leaveTypesList = [
    { type: "Annual Leave", max: "14 Days", desc: "Paid annual leave allocation", active: true },
    { type: "Casual Leave", max: "7 Days", desc: "Short term personal leave", active: true },
    { type: "Medical Leave", max: "14 Days", desc: "Medical treatment leave", active: true },
    { type: "No-Pay Leave", max: "30 Days", desc: "Unpaid leave block", active: true },
    { type: "Half-Day Leave", max: "-", desc: "Half day leave block", active: true },
    { type: "Short Leave", max: "2 Days", desc: "Short duration leave", active: true },
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
      {/* Leave statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
          <p className="text-xl font-bold text-slate-800 leading-none mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
          <p className="text-xl font-bold text-amber-600 leading-none mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Leaves</span>
          <p className="text-xl font-bold text-emerald-600 leading-none mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected Leaves</span>
          <p className="text-xl font-bold text-rose-600 leading-none mt-1">{stats.rejected}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs bg-slate-900 text-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Days Taken</span>
          <p className="text-xl font-bold text-white leading-none mt-1">{stats.totalTaken}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
          <p className="text-xl font-bold text-blue-600 leading-none mt-1">{stats.available}</p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Leave Requests Log - 2 cols */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
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
                    placeholder="Search name, leave type..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50 focus:bg-white"
                  />
                </div>
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
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">From Date</th>
                    <th className="py-3 px-4">To Date</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason</th>
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
                            <span className="font-bold text-slate-700">{req.empName}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{req.department}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">{req.leaveType}</td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{req.fromDate}</td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{req.toDate}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600">{req.duration}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-[120px] truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusStyle(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === "Pending" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => handleApprovalConfirm(req.empId, req.id, "Approved", e)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => handleApprovalConfirm(req.empId, req.id, "Rejected", e)}
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
                        No leave requests found matching filters
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

        {/* Right side widgets - Balance donut + Apply form */}
        <div className="space-y-6">
          {/* Donut chart for leave balance */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Leave Balance Overview</h3>
              <p className="text-xs text-slate-400">Total days allocated breakdown</p>
            </div>
            <div className="h-44 relative my-2 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={balanceData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                      {balanceData.map((entry, index) => (
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
                <span className="text-xl font-bold text-slate-800">142.5</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Days Available</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-slate-600">
              {balanceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}: {item.value}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Leave drawer Form */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-blue-600 animate-pulse" /> Apply Leave
            </h3>
            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</label>
                <select
                  value={formLeaveType}
                  onChange={(e) => setFormLeaveType(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="No-Pay Leave">No-Pay Leave</option>
                  <option value="Special Leave">Special Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                  <input
                    type="date"
                    value={formFromDate}
                    onChange={(e) => setFormFromDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                  <input
                    type="date"
                    value={formToDate}
                    onChange={(e) => setFormToDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day Portion</label>
                  <select
                    value={formHalfDay}
                    onChange={(e) => setFormHalfDay(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="Full Day">Full Day</option>
                    <option value="First Half">First Half</option>
                    <option value="Second Half">Second Half</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</label>
                <textarea
                  required
                  rows={2}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="E.g. Family medical appointment..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Submit Leave Request
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Leave Types Configuration details */}
      <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Leave Types Configuration</h3>
            <p className="text-xs text-slate-400">Default leave policies configured for employees</p>
          </div>
          <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-white">
            Manage Types
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="py-2.5 px-4">Leave Type</th>
                <th className="py-2.5 px-4 text-center">Max Days</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {leaveTypesList.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/30">
                  <td className="py-2.5 px-4 font-bold text-slate-700">{item.type}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-600">{item.max}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-medium">{item.desc}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
