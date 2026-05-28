"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Users,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings2,
  Clock,
  Bell,
  Briefcase,
  Edit2
} from "lucide-react";
import { mockEmployees, mockShifts, Shift } from "@/lib/mockData";

export default function ShiftRosterPage() {
  const [deptFilter, setDeptFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [viewMode, setViewMode] = useState("week"); // week, month
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Roster rule state
  const [rules, setRules] = useState({
    gracePeriod: 15,
    lateAfter: "Grace Period",
    earlyBefore: 15,
    defaultBreak: 60,
    minWorkHours: 8,
    otAfter: 8
  });

  // Extract unique departments
  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(mockEmployees.map(emp => emp.department)))];
  }, []);

  // Filter roster rows
  const rosterData = useMemo(() => {
    // Generate mock schedules for employees
    const schedules = [
      { name: "Nimal Perera", dept: "IT Department", mon: "General Shift", tue: "General Shift", wed: "General Shift", thu: "General Shift", fri: "General Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Kavindi Silva", dept: "HR Department", mon: "General Shift", tue: "General Shift", wed: "Flexible Shift", thu: "Flexible Shift", fri: "General Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Minura Fernando", dept: "Finance Department", mon: "Night Shift", tue: "Night Shift", wed: "Night Shift", thu: "Night Shift", fri: "Night Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Tharushi De Silva", dept: "Marketing Department", mon: "Rotating Shift", tue: "Rotating Shift", wed: "Rotating Shift", thu: "Rotating Shift", fri: "Rotating Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Kasun Rajapaksa", dept: "Operations Department", mon: "General Shift", tue: "General Shift", wed: "General Shift", thu: "Holiday Shift", fri: "General Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Isuri Madushani", dept: "IT Department", mon: "Flexible Shift", tue: "Flexible Shift", wed: "General Shift", thu: "Flexible Shift", fri: "General Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Ravindu Bandara", dept: "Finance Department", mon: "Night Shift", tue: "Night Shift", wed: "Night Shift", thu: "Night Shift", fri: "Night Shift", sat: "Weekend Off", sun: "Weekend Off" },
      { name: "Pavithra Jayasinghe", dept: "HR Department", mon: "General Shift", tue: "General Shift", wed: "Flexible Shift", thu: "General Shift", fri: "Flexible Shift", sat: "Weekend Off", sun: "Weekend Off" }
    ];

    return schedules.filter(row => {
      const matchesDept = deptFilter === "All" || row.dept === deptFilter;
      // Filter if any day matches the selected shift filter
      const matchesShift = shiftFilter === "All" ||
        row.mon === shiftFilter ||
        row.tue === shiftFilter ||
        row.wed === shiftFilter ||
        row.thu === shiftFilter ||
        row.fri === shiftFilter;
      return matchesDept && matchesShift;
    });
  }, [deptFilter, shiftFilter]);

  const getShiftBadgeStyle = (shiftName: string) => {
    switch (shiftName) {
      case "General Shift":
        return "bg-green-50 text-green-700 border border-green-200/60";
      case "Night Shift":
        return "bg-purple-50 text-purple-700 border border-purple-200/60";
      case "Flexible Shift":
        return "bg-blue-50 text-blue-700 border border-blue-200/60";
      case "Rotating Shift":
        return "bg-orange-50 text-orange-700 border border-orange-200/60";
      case "Holiday Shift":
        return "bg-rose-50 text-rose-700 border border-rose-200/60";
      case "Weekend Off":
        return "bg-slate-50 text-slate-400 border border-slate-200/30";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRulesModal(false);
  };

  return (
    <div className="space-y-6 select-none">
      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Shifts</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">8 Types</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employees Mapped</span>
            <p className="text-lg font-bold text-emerald-600 leading-none mt-0.5">256 (100%)</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Shifts</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">6 Shifts</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">12 Allocated</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs col-span-2 lg:col-span-1 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roster Published</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">May 20, 2024</p>
          </div>
        </div>
      </div>

      {/* Main scheduler calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar View - 3 cols */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-3 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Calendar Controls / Filters */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Date navigator */}
                <div className="flex items-center gap-1.5 border border-slate-200 p-1.5 rounded-lg bg-slate-50">
                  <button className="p-1 hover:bg-white hover:shadow-xs rounded-md text-slate-600 transition-all cursor-pointer">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-1">May 20 – May 26, 2024</span>
                  <button className="p-1 hover:bg-white hover:shadow-xs rounded-md text-slate-600 transition-all cursor-pointer">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer bg-white">
                  Today
                </button>

                {/* Filters */}
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
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  <option value="All">All Shifts</option>
                  {mockShifts.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* View options */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 border border-slate-200 p-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-500">
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "week" ? "bg-white text-slate-800 shadow-xs" : "hover:text-slate-700"
                    }`}
                  >
                    Week View
                  </button>
                  <button
                    onClick={() => setViewMode("month")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "month" ? "bg-white text-slate-800 shadow-xs" : "hover:text-slate-700"
                    }`}
                  >
                    Month View
                  </button>
                </div>
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </div>

            {/* Roster Calendar Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-b border-slate-100">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-4 min-w-[150px]">Employee</th>
                    <th className="py-3 px-3 text-center">Mon 20</th>
                    <th className="py-3 px-3 text-center">Tue 21</th>
                    <th className="py-3 px-3 text-center">Wed 22</th>
                    <th className="py-3 px-3 text-center">Thu 23</th>
                    <th className="py-3 px-3 text-center">Fri 24</th>
                    <th className="py-3 px-3 text-center bg-slate-50/50">Sat 25</th>
                    <th className="py-3 px-3 text-center bg-slate-50/50">Sun 26</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rosterData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{row.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{row.dept.split(" ")[0]} Dept</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.mon)}`}>
                          {row.mon}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.tue)}`}>
                          {row.tue}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.wed)}`}>
                          {row.wed}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.thu)}`}>
                          {row.thu}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.fri)}`}>
                          {row.fri}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center bg-slate-50/20">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.sat)}`}>
                          {row.sat}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center bg-slate-50/20">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold ${getShiftBadgeStyle(row.sun)}`}>
                          {row.sun}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Roster Published: Mon May 20, 2024 at 09:30 AM by Admin</span>
            <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10 cursor-pointer">
              Publish Next Week's Roster
            </button>
          </div>
        </div>

        {/* Shift Type Info - 1 col */}
        <div className="space-y-6 lg:col-span-1">
          {/* Active Shift List */}
          <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Shift Types</h3>
              <button className="p-1 hover:bg-slate-50 rounded-md text-blue-600 cursor-pointer" title="Add Shift">
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="space-y-3 max-h-[19.5rem] overflow-y-auto pr-1">
              {mockShifts.map((shift) => (
                <div key={shift.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">{shift.name}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {shift.time}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">{shift.grace}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shift Settings & Grace Periods */}
          <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Settings2 className="h-4.5 w-4.5 text-slate-500" />
                Shift Rules & Settings
              </h3>
              <button
                onClick={() => setShowRulesModal(true)}
                className="p-1 hover:bg-slate-50 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Default Grace Period</span>
                <span className="font-bold text-slate-700">{rules.gracePeriod} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Late Mark After</span>
                <span className="font-bold text-slate-700">{rules.lateAfter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Early Leave Before</span>
                <span className="font-bold text-slate-700">{rules.earlyBefore} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Default Break Time</span>
                <span className="font-bold text-slate-700">{rules.defaultBreak / 60} Hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Minimum Working Hours</span>
                <span className="font-bold text-slate-700">{rules.minWorkHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Overtime After</span>
                <span className="font-bold text-slate-700">{rules.otAfter} Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Notification & Allocation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Wise Allocation */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Department Wise Shift Allocation</h3>
              <p className="text-xs text-slate-400">Default schedules mapped for each division</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Assigned Shifts</th>
                    <th className="py-2.5 px-4 text-center">Employees</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-700">IT Department</td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">General Shift, Night Shift, Flexible Shift</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">45</td>
                    <td className="py-3 px-4 text-center">
                      <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"><Edit2 className="h-3.5 w-3.5 mx-auto" /></button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-700">HR Department</td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">General Shift, Flexible Shift</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">32</td>
                    <td className="py-3 px-4 text-center">
                      <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"><Edit2 className="h-3.5 w-3.5 mx-auto" /></button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-700">Finance Department</td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">General Shift, Night Shift</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">38</td>
                    <td className="py-3 px-4 text-center">
                      <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"><Edit2 className="h-3.5 w-3.5 mx-auto" /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Schedule & Holiday Notifications */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Bell className="h-4.5 w-4.5 text-blue-600 animate-bounce" />
              Roster Notifications
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[9px] shrink-0 mt-0.5">Alert</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-700">Roster Review Pending</span>
                  <p className="text-[10px] text-slate-500 leading-normal">Next week's draft roster requires publishing. Deadline: Thursday 05:00 PM.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <span className="px-2 py-0.5 bg-amber-600 text-white font-bold rounded text-[9px] shrink-0 mt-0.5">Holiday</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-700">Upcoming Public Holiday</span>
                  <p className="text-[10px] text-slate-500 leading-normal">Vesak Poya Day falls on May 23. Special holiday shift rules will apply.</p>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
            Open Full Calendar
          </button>
        </div>
      </div>

      {/* Edit Shift Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Settings2 className="h-4.5 w-4.5 text-blue-600" />
                Configure Shift Rules
              </h3>
            </div>
            <form onSubmit={handleSaveRules} className="p-6 space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    value={rules.gracePeriod}
                    onChange={(e) => setRules(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minimum Working Hours</label>
                  <input
                    type="number"
                    value={rules.minWorkHours}
                    onChange={(e) => setRules(prev => ({ ...prev, minWorkHours: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime Start (Hours)</label>
                  <input
                    type="number"
                    value={rules.otAfter}
                    onChange={(e) => setRules(prev => ({ ...prev, otAfter: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
