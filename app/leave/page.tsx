"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  FileCheck2,
  Plus,
  Search,
  Download,
  AlertCircle,
  FileText,
  BookmarkCheck,
  Send,
  Trash2
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { mockLeaveRequests, LeaveRequest } from "@/lib/mockData";

export default function LeavePage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [requests, setRequests] = useState<LeaveRequest[]>(mockLeaveRequests);

  // Form states
  const [formLeaveType, setFormLeaveType] = useState("Annual Leave");
  const [formFromDate, setFormFromDate] = useState("2024-05-21");
  const [formToDate, setFormToDate] = useState("2024-05-23");
  const [formDuration, setFormDuration] = useState("3 Days");
  const [formHalfDay, setFormHalfDay] = useState("Full Day");
  const [formReason, setFormReason] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReason) {
      alert("Please specify a reason");
      return;
    }
    const freshLeave: LeaveRequest = {
      id: `LV00${requests.length + 1}`,
      empName: "Admin User",
      department: "Management",
      leaveType: formLeaveType,
      fromDate: formFromDate,
      toDate: formToDate,
      duration: formDuration,
      reason: formReason,
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0]
    };
    setRequests(prev => [freshLeave, ...prev]);
    setFormReason("");
  };

  const handleApproval = (id: string, action: "Approved" | "Rejected") => {
    setRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, status: action } : req))
    );
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === "Pending").length;
    const approved = requests.filter(r => r.status === "Approved").length;
    const rejected = requests.filter(r => r.status === "Rejected").length;
    const totalTaken = 87.5; // Mock static count based on PDF
    const available = 142.5;

    return {
      total: requests.length,
      pending,
      approved,
      rejected,
      totalTaken,
      available
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = req.empName.toLowerCase().includes(searchTerm.toLowerCase()) || req.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Chart data
  const balanceData = [
    { name: "Annual Leave", value: 68.5, color: "#3b82f6" },
    { name: "Casual Leave", value: 25.0, color: "#10b981" },
    { name: "Medical Leave", value: 15.0, color: "#ef4444" },
    { name: "Special Leave", value: 12.0, color: "#f59e0b" },
    { name: "Other Leave", value: 22.0, color: "#6366f1" },
  ];

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
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
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
                                onClick={() => handleApproval(req.id, "Approved")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval(req.id, "Rejected")}
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
            <span>Showing 1 to {filteredRequests.length} of {filteredRequests.length} logs</span>
            <div className="flex items-center gap-1.5">
              <button className="px-2 py-0.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Prev</button>
              <button className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md">1</button>
              <button className="px-2 py-0.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Next</button>
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
                <ResponsiveContainer width="100%" height="100%">
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
    </div>
  );
}
