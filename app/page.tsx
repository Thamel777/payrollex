"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  CalendarCheck,
  TrendingUp,
  Fingerprint,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import Link from "next/link";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connected");
  const [lastSyncTime, setLastSyncTime] = useState("Today, 10:15 AM");
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: "LV-01", type: "Leave", name: "Kavindi Silva", dept: "HR", details: "Medical Leave (1 Day)", status: "Pending" },
    { id: "OT-01", type: "Overtime", name: "Minura Fernando", dept: "Finance", details: "Night OT (4 Hours)", status: "Pending" },
    { id: "AT-01", type: "Correction", name: "Ravindu Bandara", dept: "Finance", details: "Missing Punch (May 19)", status: "Pending" },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Today, ${time}`);
    }, 1500);
  };

  const handleApprove = (id: string) => {
    setPendingApprovals(prev => prev.filter(app => app.id !== id));
  };

  // Mock data for charts
  const attendanceData = [
    { name: "Present", value: 198, color: "#10b981" },
    { name: "Absent", value: 32, color: "#ef4444" },
    { name: "Late", value: 18, color: "#f97316" },
    { name: "Early Leave", value: 8, color: "#eab308" },
  ];

  const weeklyTrendData = [
    { day: "Mon", Present: 185, Late: 22, Absent: 15 },
    { day: "Tue", Present: 198, Late: 18, Absent: 12 },
    { day: "Wed", Present: 190, Late: 25, Absent: 16 },
    { day: "Thu", Present: 202, Late: 12, Absent: 10 },
    { day: "Fri", Present: 195, Late: 15, Absent: 14 },
    { day: "Sat", Present: 45, Late: 2, Absent: 8 },
    { day: "Sun", Present: 20, Late: 1, Absent: 5 },
  ];

  const payrollBreakdownData = [
    { dept: "IT", Basic: 720000, Allowances: 120000, Overtime: 45000 },
    { dept: "HR", Basic: 480000, Allowances: 85000, Overtime: 20000 },
    { dept: "Finance", Basic: 620000, Allowances: 95000, Overtime: 32000 },
    { dept: "Marketing", Basic: 410000, Allowances: 60000, Overtime: 15000 },
    { dept: "Operations", Basic: 890000, Allowances: 150000, Overtime: 80000 },
  ];

  const kpis = [
    { title: "Total Employees", value: "256", icon: Users, color: "from-blue-500 to-indigo-600", desc: "All departments", change: "+8 new joiners" },
    { title: "Today's Attendance", value: "198 / 256", icon: Clock, color: "from-emerald-400 to-teal-600", desc: "77.3% Present rate", change: "18 late arrivals" },
    { title: "Active Leaves", value: "18", icon: CalendarCheck, color: "from-amber-400 to-orange-500", desc: "Approved for today", change: "6 pending requests" },
    { title: "Monthly Payroll Cost", value: "LKR 8,245,680", icon: TrendingUp, color: "from-rose-500 to-pink-600", desc: "Net salary + allowances", change: "LKR 245K Overtime cost" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back, Admin User!</h2>
          <p className="text-blue-100 text-sm max-w-xl">
            Everything is running smoothly. The BioStar 2 fingerprint integration is active, and attendance logs are syncing in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 z-10">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex flex-col text-right">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Device Sync Status</span>
            <span className="text-sm font-bold flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              {syncStatus}
            </span>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="h-12 bg-white hover:bg-slate-100 text-blue-800 font-semibold px-4 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg disabled:opacity-75 focus:outline-none"
          >
            <RefreshCw className={`h-4.5 w-4.5 text-blue-700 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-card-border shadow-xs hover:shadow-md transition-all hover:translate-y-[-2px] relative overflow-hidden group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                  <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${kpi.color} text-white rounded-xl shadow-md shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{kpi.desc}</span>
                <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Attendance Distribution</h3>
            <p className="text-xs text-slate-400">Daily punch statistics summary</p>
          </div>
          <div className="h-64 relative my-2 flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">Loading Charts...</div>
            )}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">198</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Present</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {attendanceData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px] leading-none">{item.name}</span>
                  <span className="font-bold text-slate-700 mt-0.5">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Weekly Attendance Trend</h3>
              <p className="text-xs text-slate-400">Compare presence vs absenteeism over the week</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 p-1 rounded-lg">
              <span className="px-2 py-0.5 rounded bg-white text-slate-800 shadow-xs cursor-pointer">Week</span>
              <span className="px-2 py-0.5 cursor-pointer">Month</span>
            </div>
          </div>
          <div className="h-64 my-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "#94a3b8" }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                  <Area type="monotone" dataKey="Present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Late" stroke="#f97316" fillOpacity={1} fill="url(#colorLate)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">Loading Charts...</div>
            )}
          </div>
        </div>
      </div>

      {/* Approvals & BioStar Sync logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pending Approvals</h3>
                <p className="text-xs text-slate-400">Actions required by administrators</p>
              </div>
              <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                {pendingApprovals.length} Actions
              </span>
            </div>
            <div className="space-y-3 min-h-[16rem]">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{item.name}</span>
                          <span className="text-[9px] text-slate-500 font-semibold bg-slate-200 px-1.5 py-0.2 rounded-md uppercase">
                            {item.dept}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <span className="font-semibold text-indigo-600">[{item.type}]</span> {item.details}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
                  <ShieldCheck className="h-10 w-10 text-emerald-500" />
                  <p className="text-xs font-bold text-slate-600">All caught up!</p>
                  <p className="text-[10px] text-slate-400">No pending approvals remaining.</p>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-end">
            <Link href="/leave" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
              View All Leave Approvals <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Integration Status Log */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Integration Logs</h3>
                <p className="text-xs text-slate-400">BioStar 2 API logs</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Last Successful Synchronization</p>
                <p className="font-bold text-slate-700 mt-1">{lastSyncTime}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-medium">
                  <span>Connection: TCP/IP</span>
                  <span className="text-emerald-600 font-bold">1,245 logs imported</span>
                </div>
              </div>

              <div className="space-y-2.5 overflow-hidden">
                <div className="flex items-start gap-2.5 border-l-2 border-emerald-500 pl-3 py-0.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Sync Completed</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">10:15 AM - BioStar 2 Web API</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 border-l-2 border-emerald-500 pl-3 py-0.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Device Handshake Ok</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">10:00 AM - Device: BS2-Core</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 border-l-2 border-amber-500 pl-3 py-0.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Manual Punch Override</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">09:12 AM - EMP002 In-Time edited</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold">API Version: v2.8.3</span>
            <Link href="/biostar-integration" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
              Integration Settings <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
