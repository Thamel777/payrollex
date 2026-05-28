"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  Search,
  Download,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  UserCheck
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
import { mockAttendance, AttendanceRecord } from "@/lib/mockData";

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [isSyncing, setIsSyncing] = useState(false);

  // Correction requests state
  const [corrections, setCorrections] = useState([
    { id: 1, name: "Ravindu Bandara", date: "May 19, 2024", type: "Missing Punch", status: "Pending" },
    { id: 2, name: "Kasun Rajapaksa", date: "May 18, 2024", type: "Early Leave", status: "Pending" },
    { id: 3, name: "Kavindi Silva", date: "May 17, 2024", type: "Late Arrival", status: "Approved" },
    { id: 4, name: "Minura Fernando", date: "May 16, 2024", type: "Missing Punch", status: "Rejected" },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  const handleCorrectionAction = (id: number, action: "Approved" | "Rejected") => {
    setCorrections(prev =>
      prev.map(c => (c.id === id ? { ...c, status: action } : c))
    );
  };

  // Unique departments for filter
  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(records.map(r => r.department)))];
  }, [records]);

  // Filters daily records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = rec.name.toLowerCase().includes(searchTerm.toLowerCase()) || rec.empId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === "All" || rec.department === deptFilter;
      const matchesStatus = statusFilter === "All" || rec.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [records, searchTerm, deptFilter, statusFilter]);

  // Compute metric counts
  const stats = useMemo(() => {
    const total = 256; // Mock total employees
    const present = records.filter(r => r.status === "Present").length + records.filter(r => r.status === "Late").length + records.filter(r => r.status === "Early Leave").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const late = records.filter(r => r.status === "Late").length;
    const early = records.filter(r => r.status === "Early Leave").length;
    const missing = records.filter(r => r.status === "Missing Punch").length;

    return {
      total,
      present,
      absent,
      late,
      early,
      missing,
      presentPct: ((present / total) * 100).toFixed(1),
      absentPct: ((absent / total) * 100).toFixed(1),
      latePct: ((late / total) * 100).toFixed(1),
      earlyPct: ((early / total) * 100).toFixed(1),
      missingPct: ((missing / total) * 100).toFixed(1),
    };
  }, [records]);

  const pieData = [
    { name: "Present", value: stats.present, color: "#10b981" },
    { name: "Absent", value: stats.absent, color: "#ef4444" },
    { name: "Late", value: stats.late, color: "#f97316" },
    { name: "Early Leave", value: stats.early, color: "#eab308" },
  ];

  const timelineData = [
    { time: "08:00 AM", CheckIn: 45, CheckOut: 0 },
    { time: "09:00 AM", CheckIn: 120, CheckOut: 2 },
    { time: "10:00 AM", CheckIn: 30, CheckOut: 5 },
    { time: "12:00 PM", CheckIn: 2, CheckOut: 15 },
    { time: "02:00 PM", CheckIn: 1, CheckOut: 20 },
    { time: "05:00 PM", CheckIn: 0, CheckOut: 135 },
    { time: "06:00 PM", CheckIn: 0, CheckOut: 25 },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-emerald-100 text-emerald-800";
      case "Late":
        return "bg-orange-100 text-orange-800";
      case "Early Leave":
        return "bg-yellow-100 text-yellow-800";
      case "Absent":
        return "bg-rose-100 text-rose-800";
      case "Missing Punch":
        return "bg-sky-100 text-sky-800";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Employees</span>
          <p className="text-xl font-bold text-slate-800 leading-none mt-1">{stats.total}</p>
          <span className="text-[9px] text-slate-400 mt-1 block">Active base roster</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present Today</span>
          <p className="text-xl font-bold text-emerald-600 leading-none mt-1">{stats.present}</p>
          <span className="text-[9px] text-emerald-600 font-bold mt-1 block">{stats.presentPct}% of total</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absent Today</span>
          <p className="text-xl font-bold text-rose-600 leading-none mt-1">{stats.absent}</p>
          <span className="text-[9px] text-rose-600 font-bold mt-1 block">{stats.absentPct}% of total</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-orange-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Late Arrivals</span>
          <p className="text-xl font-bold text-orange-600 leading-none mt-1">{stats.late}</p>
          <span className="text-[9px] text-orange-600 font-bold mt-1 block">{stats.latePct}% of total</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-yellow-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Early Departures</span>
          <p className="text-xl font-bold text-yellow-600 leading-none mt-1">{stats.early}</p>
          <span className="text-[9px] text-yellow-600 font-bold mt-1 block">{stats.earlyPct}% of total</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-sky-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missing Punch</span>
          <p className="text-xl font-bold text-sky-600 leading-none mt-1">{stats.missing}</p>
          <span className="text-[9px] text-sky-600 font-bold mt-1 block">{stats.missingPct}% of total</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Attendance Log Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Filters */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[180px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, EMP ID..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50 focus:bg-white"
                  />
                </div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  <option value="All">All Departments</option>
                  {departments.filter(d => d !== "All").map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Early Leave">Early Leave</option>
                  <option value="Absent">Absent</option>
                  <option value="Missing Punch">Missing Punch</option>
                </select>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="05/20/2024"
                    className="pl-8 pr-3 py-1.5 w-32 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 cursor-pointer focus:outline-none"
                  />
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-4">EMP ID</th>
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">In Time</th>
                    <th className="py-3 px-4">Out Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Work Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => (
                      <tr key={rec.empId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{rec.empId}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{rec.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{rec.department}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{rec.shift}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{rec.inTime}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{rec.outTime}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">{rec.workHours}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        No logs found matching filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing 1 to {filteredRecords.length} of {filteredRecords.length} records</span>
            <div className="flex items-center gap-1.5">
              <button className="px-2 py-0.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Prev</button>
              <button className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md">1</button>
              <button className="px-2 py-0.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Panel */}
        <div className="space-y-6">
          {/* Summary Donuts */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Attendance Distribution</h3>
              <p className="text-xs text-slate-400">Total active headcount review</p>
            </div>
            <div className="h-44 relative my-2 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
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
                <span className="text-xl font-bold text-slate-800">{stats.present}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Present</span>
              </div>
            </div>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer">
              <UserCheck className="h-4 w-4" /> Review & Approve Attendance
            </button>
          </div>

          {/* Today's Punch Trend */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Today's Punch Trend</h3>
              <p className="text-xs text-slate-400">Sync load check-in vs check-out</p>
            </div>
            <div className="h-44 mt-4">
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} style={{ fontSize: "9px", fill: "#94a3b8" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "9px", fill: "#94a3b8" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="CheckIn" stroke="#3b82f6" strokeWidth={2} dot={false} name="Check In" />
                    <Line type="monotone" dataKey="CheckOut" stroke="#10b981" strokeWidth={2} dot={false} name="Check Out" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Loading trend...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync State & Manual Corrections Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Sync Info Box */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Fingerprint className="h-4.5 w-4.5 text-blue-600" />
                BioStar 2 Machine
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-full border border-emerald-200">
                Connected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium">Device Name</span>
                <p className="font-bold text-slate-700">BS2-Core</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium">IP Address</span>
                <p className="font-bold text-slate-700">192.168.1.201</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium">Last Sync</span>
                <p className="font-bold text-slate-700">Today, 10:15 AM</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium">Logs Today</span>
                <p className="font-bold text-slate-700">1,245 punch logs</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full mt-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-70 focus:outline-none cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Synchronizing logs..." : "Sync Now"}
          </button>
        </div>

        {/* Manual Corrections Requests */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Manual Correction Requests</h3>
                <p className="text-xs text-slate-400">Employee punch modification adjustments</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                View All Requests
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Request Date</th>
                    <th className="py-2.5 px-4">Adjustment Type</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {corrections.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-bold text-slate-700">{item.name}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{item.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-600">{item.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            item.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : item.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === "Pending" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCorrectionAction(item.id, "Approved")}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleCorrectionAction(item.id, "Rejected")}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[10px] rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
