"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  Play,
  RotateCcw,
  Eye,
  FileText
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { mockEmployees, Employee } from "@/lib/mockData";
import Link from "next/link";

export default function PayrollPage() {
  const [mounted, setMounted] = useState(false);
  const [deptFilter, setDeptFilter] = useState("All");
  const [payrollStatus, setPayrollStatus] = useState("Pending"); // Draft, Pending, Approved, Paid
  const [isCalculating, setIsCalculating] = useState(false);
  const [payrollStep, setPayrollStep] = useState(2); // 1 = Draft, 2 = Pending, 3 = Approved, 4 = Paid

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGeneratePayroll = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setPayrollStatus("Approved");
      setPayrollStep(3);
    }, 1500);
  };

  const handleResetPayroll = () => {
    setPayrollStatus("Pending");
    setPayrollStep(2);
  };

  // Generate department summary metrics
  const departmentSummaries = [
    { name: "IT Department", count: 45, basic: 1125000, allowances: 225000, ot: 120450, deductions: 265450, net: 1205000 },
    { name: "HR Department", count: 32, basic: 640000, allowances: 128000, ot: 65300, deductions: 142200, net: 691100 },
    { name: "Finance Department", count: 38, basic: 950000, allowances: 180500, ot: 95750, deductions: 205300, net: 1020950 },
    { name: "Marketing Department", count: 28, basic: 560000, allowances: 112000, ot: 58400, deductions: 132800, net: 597600 },
    { name: "Operations Department", count: 62, basic: 1850000, allowances: 370000, ot: 175600, deductions: 370000, net: 2025600 },
    { name: "Sales Department", count: 40, basic: 930000, allowances: 185800, ot: 130250, deductions: 211300, net: 1034750 },
  ];

  // Employee breakdown logs
  const employeePayrollPreview = useMemo(() => {
    const list = [
      { id: "EMP001", name: "Nimal Perera", dept: "IT Department", basic: 150000, allowances: 25000, ot: 12500, gross: 187500, deductions: 28450, loans: 10000, epf: 16875, etf: 5062.5, tax: 8200, net: 118912.5, status: "Approved" },
      { id: "EMP002", name: "Kavindi Silva", dept: "HR Department", basic: 120000, allowances: 18000, ot: 8000, gross: 146000, deductions: 22100, loans: 5000, epf: 13140, etf: 3942, tax: 6500, net: 95318, status: "Approved" },
      { id: "EMP003", name: "Minura Fernando", dept: "Finance Department", basic: 180000, allowances: 30000, ot: 15500, gross: 225500, deductions: 33750, loans: 15000, epf: 20295, etf: 6088.5, tax: 10500, net: 139866.5, status: "Approved" },
      { id: "EMP004", name: "Tharushi De Silva", dept: "Marketing Department", basic: 110000, allowances: 15000, ot: 6000, gross: 131000, deductions: 19600, loans: 5000, epf: 11790, etf: 3519, tax: 5200, net: 86991, status: "Approved" },
      { id: "EMP005", name: "Kasun Rajapaksa", dept: "Operations Department", basic: 250000, allowances: 45000, ot: 22000, gross: 317000, deductions: 47550, loans: 20000, epf: 28530, etf: 8559, tax: 18200, net: 194161, status: "Approved" },
    ];

    return list.filter(item => deptFilter === "All" || item.dept === deptFilter);
  }, [deptFilter]);

  // Donut chart breakdown data
  const pieData = [
    { name: "Basic Salary", value: 5120000, color: "#3b82f6" },
    { name: "Allowances", value: 1245300, color: "#10b981" },
    { name: "Overtime Pay", value: 785450, color: "#8b5cf6" },
    { name: "Deductions", value: 1661730, color: "#f59e0b" },
  ];

  const getStepStyle = (step: number) => {
    if (payrollStep >= step) return "text-blue-600 bg-blue-50 border-blue-600";
    return "text-slate-400 bg-slate-50 border-slate-200";
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Employees</span>
          <p className="text-xl font-bold text-slate-800 leading-none mt-1">256 Members</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processed Status</span>
          <p className="text-xl font-bold text-emerald-600 leading-none mt-1">245 / 256</p>
          <span className="text-[9px] text-slate-400 font-semibold mt-1 block">95.70% Completed</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payroll Cost</span>
          <p className="text-xl font-bold text-blue-600 leading-none mt-1">LKR 8,245,680</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Net Pay</span>
          <p className="text-xl font-bold text-indigo-600 leading-none mt-1">LKR 6,583,950</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Deductions</span>
          <p className="text-xl font-bold text-amber-600 leading-none mt-1">LKR 1,661,730</p>
        </div>
      </div>

      {/* Main control filter headers */}
      <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Pay Period</span>
            <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none">
              <option value="May 2024">May 2024 (05/01/2024 - 05/31/2024)</option>
              <option value="April 2024">April 2024</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Department</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="IT Department">IT Department</option>
              <option value="HR Department">HR Department</option>
              <option value="Finance Department">Finance Department</option>
              <option value="Operations Department">Operations Department</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Employment Type</span>
            <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white focus:outline-none">
              <option value="All">All Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetPayroll}
            className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 bg-white cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={handleGeneratePayroll}
            disabled={isCalculating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-75 cursor-pointer"
          >
            <Play className={`h-4 w-4 ${isCalculating ? "animate-spin" : ""}`} />
            {isCalculating ? "Calculating salary..." : "Generate Payroll"}
          </button>
        </div>
      </div>

      {/* Grid view containing summaries and breakdown donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Department breakdown summary - 2 cols */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Payroll Summary by Department</h3>
              <p className="text-xs text-slate-400">Aggregated financial values for May 2024</p>
            </div>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer bg-white">
              <Download className="h-4 w-4" /> Export Summary
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-3 text-center">Employees</th>
                  <th className="py-2.5 px-3 text-right">Basic Salary</th>
                  <th className="py-2.5 px-3 text-right">Allowances</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                  <th className="py-2.5 px-3 text-right">Deductions</th>
                  <th className="py-2.5 px-3 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {departmentSummaries.map((dept, index) => (
                  <tr key={index} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{dept.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">{dept.count}</td>
                    <td className="py-2.5 px-3 text-right">LKR {dept.basic.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">+LKR {dept.allowances.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">+LKR {dept.ot.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600">-LKR {dept.deductions.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">LKR {dept.net.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side widgets: Status tracker and Donut breakdown */}
        <div className="space-y-6">
          {/* Payroll Cost Breakdown Donut */}
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Payroll Cost Breakdown</h3>
              <p className="text-xs text-slate-400">Total expenditure allocation</p>
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
                <span className="text-xs text-slate-400">Loading breakdown...</span>
              )}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-bold text-slate-800">LKR 8.2M</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Total Cost</span>
              </div>
            </div>
            <div className="space-y-2 text-[9px] font-semibold text-slate-600">
              <div className="grid grid-cols-2 gap-1.5">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="truncate">{item.name}: {((item.value / 8245680) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow Status Tracker */}
          <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">
              Payroll Processing Status
            </h3>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${getStepStyle(1)}`}>1</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-700 font-bold">Draft Calculated</span>
                  <span className="text-[9px] text-slate-400">All attendance sheets verified</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${getStepStyle(2)}`}>2</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-700 font-bold">Pending Review</span>
                  <span className="text-[9px] text-slate-400">Verification of OT and Allowances</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${getStepStyle(3)}`}>3</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-700 font-bold">Approved by Finance</span>
                  <span className="text-[9px] text-slate-400">Pending bank transfer schedule</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${getStepStyle(4)}`}>4</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-700 font-bold">Paid & Emailed</span>
                  <span className="text-[9px] text-slate-400">Emailed digital payslips to employees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed calculation variables & preview log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculation Variables */}
        <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">
              Monthly Calculation Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Total Work Days</span>
                <p className="font-bold text-slate-700">26 Days</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Present Days</span>
                <p className="font-bold text-slate-700">20,548 Man-days</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">No-Pay Days</span>
                <p className="font-bold text-slate-700">1,254 Man-days</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold">Overtime Hours</span>
                <p className="font-bold text-slate-700">1,875h 30m</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-800 font-medium leading-normal">
              Payroll calculation is processed dynamically using BioStar 2 fingerprint punch logs, approved leaves, manual adjustments, and company tax tables.
            </div>
          </div>
        </div>

        {/* Employee Preview logs */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Employee Payroll Preview</h3>
                <p className="text-xs text-slate-400">Detailed line item calculation check</p>
              </div>
              <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors bg-white cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 inline mr-1" /> Export Details
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3 text-right">Basic</th>
                    <th className="py-2.5 px-3 text-right">Allowances</th>
                    <th className="py-2.5 px-3 text-right">Overtime</th>
                    <th className="py-2.5 px-3 text-right">Gross Pay</th>
                    <th className="py-2.5 px-3 text-right">Deductions</th>
                    <th className="py-2.5 px-3 text-right">Net Pay</th>
                    <th className="py-2.5 px-3 text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {employeePayrollPreview.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{emp.name}</span>
                          <span className="text-[9px] text-slate-400">{emp.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">LKR {emp.basic.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">+LKR {emp.allowances.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-indigo-600">+LKR {emp.ot.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">LKR {emp.gross.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-rose-600">-LKR {emp.deductions.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">LKR {emp.net.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <Link href="/payslips" className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded inline-block transition-colors" title="View Payslip">
                          <FileText className="h-4 w-4 mx-auto" />
                        </Link>
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
