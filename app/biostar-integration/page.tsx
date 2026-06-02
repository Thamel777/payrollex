"use client";

import { useState, useMemo } from "react";
import {
  Fingerprint,
  RefreshCw,
  Cpu,
  Database,
  CalendarCheck,
  ShieldCheck,
  Play,
  ArrowRight,
  Server,
  Network,
  Activity,
  PlusCircle,
  HelpCircle,
  Clock
} from "lucide-react";

export default function BiostarIntegrationPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, time: "May 20, 2024 10:15 AM", event: "Attendance Sync", details: "1,245 punch records imported from BioStar 2", status: "Success" },
    { id: 2, time: "May 20, 2024 10:00 AM", event: "Device Connection", details: "Handshake completed with Main Office Device", status: "Success" },
    { id: 3, time: "May 20, 2024 09:45 AM", event: "Attendance Sync", details: "1,198 records imported from BioStar 2", status: "Success" },
    { id: 4, time: "May 20, 2024 09:30 AM", event: "Device Connection", details: "Handshake completed with Branch Office Device", status: "Success" },
    { id: 5, time: "May 20, 2024 09:15 AM", event: "Attendance Sync", details: "1,150 records imported from BioStar 2", status: "Success" },
  ]);

  const [logsPage, setLogsPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedLogs = useMemo(() => {
    const startIndex = (logsPage - 1) * itemsPerPage;
    return logs.slice(startIndex, startIndex + itemsPerPage);
  }, [logs, logsPage]);

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const time = new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      const newLog = {
        id: logs.length + 1,
        time,
        event: "Manual Sync",
        details: "Force sync triggered: 45 punch records updated",
        status: "Success"
      };
      setLogs(prev => [newLog, ...prev]);
      setLogsPage(1);
    }, 1500);
  };

  const steps = [
    { title: "Employee Registered", desc: "Employee is registered in BioStar 2 fingerprint machine.", icon: Fingerprint },
    { title: "Employee Mapping", desc: "Employee fingerprint/user ID is mapped with payroll employee ID.", icon: Network },
    { title: "PUNCH", desc: "BioStar 2 records punch-in and punch-out events.", icon: Activity },
    { title: "Data Synchronization", desc: "Web payroll system synchronizes attendance logs via API.", icon: RefreshCw },
    { title: "Attendance Calculation", desc: "System calculates daily attendance based on shift rules.", icon: CalendarCheck },
    { title: "HR Verification", desc: "HR verifies and approves attendance records.", icon: ShieldCheck },
    { title: "Payroll Generation", desc: "Payroll is generated from approved attendance data.", icon: Server },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Integration KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mapped Employees</span>
          <p className="text-xl font-bold text-slate-800 leading-none mt-1">256 / 256</p>
          <span className="text-[9px] text-emerald-600 font-bold mt-1 block">100% of Active base</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected Devices</span>
          <p className="text-xl font-bold text-blue-600 leading-none mt-1">3 Devices</p>
          <span className="text-[9px] text-emerald-600 font-bold mt-1 block">All devices online</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Punch Logs</span>
          <p className="text-xl font-bold text-indigo-600 leading-none mt-1">1,245 logs</p>
          <span className="text-[9px] text-slate-400 mt-1 block">As of 10:15 AM today</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Sync Time</span>
          <p className="text-sm font-bold text-slate-700 mt-1">Today, 10:15 AM</p>
          <span className="text-[9px] text-slate-400 font-semibold mt-1 block">Auto Sync: Every 15 Min</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Integration Status</span>
          <p className="text-xl font-bold text-emerald-600 leading-none mt-1">Active</p>
          <span className="text-[9px] text-slate-400 mt-1 block">API Systems Operational</span>
        </div>
      </div>

      {/* Sync Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">Suprema BioStar 2 API Sync Interface</h3>
          <p className="text-xs text-slate-400">Trigger manual synchronization of device punch records with payroll calculations</p>
        </div>
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-75 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Synchronizing logs..." : "Sync Now"}
        </button>
      </div>

      {/* Roster step flow diagram */}
      <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">
          Sync Integration Flow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 pt-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-2 relative group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm relative group-hover:scale-105 transition-all">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-800 text-[11px] leading-tight">{step.title}</span>
                  <p className="text-[9px] text-slate-400 font-medium leading-normal max-w-[100px] mx-auto">{step.desc}</p>
                </div>
                {idx < 6 && (
                  <div className="hidden md:block absolute top-4 -right-3 text-slate-300">
                    <ArrowRight className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Split details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sync logs log - 2 cols */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Integration Logs</h3>
                <p className="text-xs text-slate-400">Chronological list of API actions and status reports</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                View All Logs
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-bold text-slate-700">{item.time}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{item.event}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{item.details}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-bold">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination for Integration Logs */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>
              Showing {logs.length === 0 ? 0 : (logsPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(logsPage * itemsPerPage, logs.length)} of {logs.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLogsPage(p => Math.max(p - 1, 1))}
                disabled={logsPage === 1}
                className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button className="px-2.5 py-1 bg-blue-600 text-white rounded-md">{logsPage}</button>
              <button
                onClick={() => setLogsPage(p => p + 1)}
                disabled={logsPage * itemsPerPage >= logs.length}
                className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Suprema details info - 1 col */}
        <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Cpu className="h-5 w-5 text-blue-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800">About BioStar 2 Integration</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600 leading-normal font-medium">
            <p>
              <strong>BioStar 2</strong> is Suprema’s open web-based security platform. Our integration utilizes secure HTTPS endpoints to query time-attendance punch records, user profiles, and event logs.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Key Benefits</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Accurate data capture directly from fingerprint devices.</li>
                <li>Real-time synchronization reduces manual administration.</li>
                <li>Eliminates proxy punching and attendance entry errors.</li>
                <li>Secure and reliable API-based communication logs.</li>
              </ul>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-50 pt-2">
              Requires BioStar 2 Server Version v2.8+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
