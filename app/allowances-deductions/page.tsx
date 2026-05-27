"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Percent,
  Plus,
  Search,
  Download,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Edit2,
  Trash2,
  ListFilter,
  CheckSquare
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { mockAllowances, mockDeductions } from "@/lib/mockData";

export default function AllowancesDeductionsPage() {
  const [mounted, setMounted] = useState(false);
  const [allowances, setAllowances] = useState(mockAllowances);
  const [deductions, setDeductions] = useState(mockDeductions);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [showAddDeduction, setShowAddDeduction] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCalcType, setFormCalcType] = useState("Fixed Amount");
  const [formAmount, setFormAmount] = useState(15000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;
    const fresh = {
      id: allowances.length + 1,
      name: formName,
      description: formDesc,
      type: formCalcType,
      frequency: "Monthly",
      amount: formAmount,
      status: "Active"
    };
    setAllowances(prev => [...prev, fresh]);
    setShowAddAllowance(false);
    resetForm();
  };

  const handleAddDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;
    const fresh = {
      id: deductions.length + 1,
      name: formName,
      description: formDesc,
      type: formCalcType,
      frequency: "Monthly",
      amount: formAmount,
      status: "Active"
    };
    setDeductions(prev => [...prev, fresh]);
    setShowAddDeduction(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormCalcType("Fixed Amount");
    setFormAmount(15000);
  };

  // Metric summaries
  const summary = useMemo(() => {
    const totalAllowance = allowances.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDeduction = deductions.reduce((acc, curr) => acc + curr.amount, 0);
    const netImpact = totalAllowance - totalDeduction;

    return {
      totalAllowance,
      totalDeduction,
      netImpact,
      activeAllowancesCount: allowances.filter(a => a.status === "Active").length,
      activeDeductionsCount: deductions.filter(d => d.status === "Active").length,
    };
  }, [allowances, deductions]);

  // Chart values
  const allowanceChartData = useMemo(() => {
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#64748b"];
    return allowances.map((a, i) => ({
      name: a.name,
      value: a.amount,
      color: colors[i % colors.length]
    }));
  }, [allowances]);

  const deductionChartData = useMemo(() => {
    const colors = ["#ef4444", "#eab308", "#ec4899", "#6366f1", "#f97316", "#06b6d4", "#64748b"];
    return deductions.map((d, i) => ({
      name: d.name,
      value: d.amount,
      color: colors[i % colors.length]
    }));
  }, [deductions]);

  // Employee Preview logs
  const employeePreview = [
    { id: "EMP001", name: "Nimal Perera", dept: "IT Department", allowance: 75000, deduction: 85000, net: -10000 },
    { id: "EMP002", name: "Kavindi Silva", dept: "HR Department", allowance: 65000, deduction: 70000, net: -5000 },
    { id: "EMP003", name: "Minura Fernando", dept: "Finance Department", allowance: 80000, deduction: 95000, net: -15000 },
    { id: "EMP004", name: "Tharushi De Silva", dept: "Marketing Department", allowance: 60000, deduction: 55000, net: 5000 },
    { id: "EMP005", name: "Kasun Rajapaksa", dept: "Operations Department", allowance: 70000, deduction: 60000, net: 10000 },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Allowances</span>
          <p className="text-xl font-bold text-blue-600 leading-none mt-1">LKR {summary.totalAllowance.toLocaleString()}</p>
          <span className="text-[9px] text-slate-400 mt-1 block">{summary.activeAllowancesCount} Active Allowance items</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Types</span>
          <p className="text-xl font-bold text-emerald-600 leading-none mt-1">{summary.activeAllowancesCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Deductions</span>
          <p className="text-xl font-bold text-rose-600 leading-none mt-1">LKR {summary.totalDeduction.toLocaleString()}</p>
          <span className="text-[9px] text-slate-400 mt-1 block">{summary.activeDeductionsCount} Active Deduction items</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Types</span>
          <p className="text-xl font-bold text-amber-600 leading-none mt-1">{summary.activeDeductionsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-indigo-500 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Payroll Impact</span>
          <p className={`text-xl font-bold leading-none mt-1 ${summary.netImpact >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            LKR {summary.netImpact.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main List Management Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allowance Management Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Allowance Management</h3>
                <p className="text-xs text-slate-400">Recurring extra payment allocations</p>
              </div>
              <button
                onClick={() => setShowAddAllowance(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Allowance
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">Allowance Name</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Sum (LKR)</th>
                    <th className="py-2.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {allowances.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-bold text-slate-700">{item.name}</td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{item.description}</td>
                      <td className="py-3 px-3 text-slate-600">{item.type}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">{item.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Deduction Management Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Deduction Management</h3>
                <p className="text-xs text-slate-400">Recurring deduction limits & policies</p>
              </div>
              <button
                onClick={() => setShowAddDeduction(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Deduction
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">Deduction Name</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Sum (LKR)</th>
                    <th className="py-2.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deductions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-bold text-slate-700">{item.name}</td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{item.description}</td>
                      <td className="py-3 px-3 text-slate-600">{item.type}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">{item.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Donut Summaries and Rule Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Allowance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Allowance Allocations</h3>
            <p className="text-xs text-slate-400">Total allowance amount distribution</p>
          </div>
          <div className="h-44 relative my-2 flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allowanceChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                    {allowanceChartData.map((entry, index) => (
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
              <span className="text-base font-bold text-slate-800">LKR 1.2M</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase">Total Allowances</span>
            </div>
          </div>
        </div>

        {/* Deduction Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Deduction Allocations</h3>
            <p className="text-xs text-slate-400">Total deduction amount distribution</p>
          </div>
          <div className="h-44 relative my-2 flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deductionChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value">
                    {deductionChartData.map((entry, index) => (
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
              <span className="text-base font-bold text-slate-800">LKR 1.6M</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase">Total Deductions</span>
            </div>
          </div>
        </div>

        {/* Rules & Checklists */}
        <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">
            Allowance / Deduction Rules
          </h3>
          <div className="space-y-3.5 text-xs text-slate-600 font-semibold">
            <div className="flex items-start gap-2.5">
              <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Allowances are paid as per company policy.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Most allowances are fixed monthly amounts.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Performance allowance is based on performance rating.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Allowances are fully taxable unless exempted.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Only active allowances will be included in payroll.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Impact on Employees Grid Preview */}
      <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Employee Allowance & Deduction Preview</h3>
            <p className="text-xs text-slate-400">Total individual sum impact preview</p>
          </div>
          <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-white">
            <Download className="h-4 w-4 inline mr-1" /> Export Impact
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="py-2.5 px-4">EMP ID</th>
                <th className="py-2.5 px-4">Employee Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-right">Total Allowances</th>
                <th className="py-2.5 px-4 text-right">Total Deductions</th>
                <th className="py-2.5 px-4 text-right">Net Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {employeePreview.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="py-3 px-4 font-bold text-slate-800">{item.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-700">{item.name}</td>
                  <td className="py-3 px-4 text-slate-500">{item.dept}</td>
                  <td className="py-3 px-4 text-right text-emerald-600">+LKR {item.allowance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-rose-600">-LKR {item.deduction.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-bold ${item.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    LKR {item.net.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Allowance Modal */}
      {showAddAllowance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-blue-600" />
                Create New Allowance
              </h3>
            </div>
            <form onSubmit={handleAddAllowance} className="p-6 space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allowance Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. Travel Allowance"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calc Type</label>
                    <select
                      value={formCalcType}
                      onChange={(e) => setFormCalcType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none font-bold"
                    >
                      <option value="Fixed Amount">Fixed Amount</option>
                      <option value="Percentage (%)">Percentage (%)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (LKR)</label>
                    <input
                      type="number"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAllowance(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10"
                >
                  Save Allowance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deduction Modal */}
      {showAddDeduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-blue-600" />
                Create New Deduction
              </h3>
            </div>
            <form onSubmit={handleAddDeduction} className="p-6 space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deduction Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. Loan Recovery"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calc Type</label>
                    <select
                      value={formCalcType}
                      onChange={(e) => setFormCalcType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none font-bold"
                    >
                      <option value="Fixed Amount">Fixed Amount</option>
                      <option value="Per Day Amount">Per Day Amount</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (LKR)</label>
                    <input
                      type="number"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeduction(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10"
                >
                  Save Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
