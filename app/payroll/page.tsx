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
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";

export default function PayrollPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("May 2024");
  const [deptFilter, setDeptFilter] = useState("All");
  const [payrollStatus, setPayrollStatus] = useState("Pending"); // Draft, Pending, Approved, Paid
  const [isCalculating, setIsCalculating] = useState(false);
  const [payrollStep, setPayrollStep] = useState(2); // 1 = Draft, 2 = Pending, 3 = Approved, 4 = Paid

  const [dbEmployees, setDbEmployees] = useState<Employee[]>([]);
  const [settingsData, setSettingsData] = useState<any>({ allowances: [], deductions: [] });
  const [payrollRunData, setPayrollRunData] = useState<any>(null);

  const [deptPage, setDeptPage] = useState(1);
  const [empPayrollPage, setEmpPayrollPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setEmpPayrollPage(1);
  }, [deptFilter]);

  useEffect(() => {
    setMounted(true);

    // 1. Sync employee list
    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setDbEmployees(list);
    });

    // 2. Sync allowances/deductions settings
    const unsubSettings = onSnapshot(doc(db, "settings", "allowances_deductions"), (docSnap) => {
      if (docSnap.exists()) {
        setSettingsData(docSnap.data());
      }
    });

    return () => {
      unsubEmployees();
      unsubSettings();
    };
  }, []);

  // Sync / load payroll runs whenever the selected period changes
  useEffect(() => {
    if (!mounted) return;
    const unsubPayroll = onSnapshot(doc(db, "payroll_runs", selectedPeriod), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPayrollRunData(data);
        setPayrollStatus(data.status || "Pending");
        if (data.status === "Draft") setPayrollStep(1);
        else if (data.status === "Pending") setPayrollStep(2);
        else if (data.status === "Approved") setPayrollStep(3);
        else if (data.status === "Paid") setPayrollStep(4);
      } else {
        setPayrollRunData(null);
        setPayrollStatus("Pending");
        setPayrollStep(2);
      }
    });
    return () => unsubPayroll();
  }, [selectedPeriod, mounted]);

  // Shared salary computation helper — runs whenever employees or settings change
  const calcTax = (income: number) => {
    if (income <= 100000) return 0;
    const taxable = income - 100000;
    if (taxable <= 41667) return taxable * 0.06;
    if (taxable <= 83334) return 41667 * 0.06 + (taxable - 41667) * 0.12;
    return 41667 * 0.06 + 41667 * 0.12 + (taxable - 83334) * 0.18;
  };

  const liveComputedEmployees = useMemo(() => {
    const employeesList = dbEmployees.length > 0 ? dbEmployees : mockEmployees;
    return employeesList.map(emp => {
      const basic = emp.basicSalary || 0;

      const empAllowances = (emp as any).allowances || [];
      const allowanceItems = (settingsData.allowances || [])
        .filter((a: any) => empAllowances.includes(a.name) || empAllowances.includes(String(a.id)))
        .map((a: any) => ({ name: a.name, amount: a.amount }));
      const allowanceAmount = allowanceItems.reduce((sum: number, curr: any) => sum + curr.amount, 0);

      // Read live OT from employee's Firestore overtimeRequests field, filtered to the selected period
      const periodYearMonth = selectedPeriod === "May 2024" ? "2024-05" : selectedPeriod === "April 2024" ? "2024-04" : selectedPeriod.replace(" ", "-").toLowerCase();
      const empOtRequests = Object.values((emp as any).overtimeRequests || {}).filter(
        (r: any) => r.status === "Approved" && r.date && r.date.startsWith(periodYearMonth)
      ) as any[];
      const otHours = empOtRequests.reduce((sum: number, r: any) => sum + (r.hours || 0), 0);
      const otAmount = empOtRequests.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      const gross = basic + allowanceAmount + otAmount;

      const empDeductions = (emp as any).deductions || [];
      const deductionItems = (settingsData.deductions || [])
        .filter((d: any) => empDeductions.includes(d.name) || empDeductions.includes(String(d.id)))
        .map((d: any) => ({ name: d.name, amount: d.amount }));
      const deductionAmount = deductionItems.reduce((sum: number, curr: any) => sum + curr.amount, 0);

      const epfEmployee = basic * 0.08;
      const epfEmployer = basic * 0.12;
      const etfEmployer = basic * 0.03;
      const tax = calcTax(gross);
      const totalDeductions = deductionAmount + epfEmployee + tax;
      const net = gross - totalDeductions;

      let workDays = 26, presentDays = 26, absentDays = 0, lateDays = 0, halfDays = 0, paidLeave = 0, noPayDays = 0;
      if (emp.attendanceLogs) {
        const yearMonth = selectedPeriod === "May 2024" ? "2024-05" : selectedPeriod === "April 2024" ? "2024-04" : "";
        const logs = Object.entries(emp.attendanceLogs).filter(([date]) => date.startsWith(yearMonth));
        if (logs.length > 0) {
          workDays = logs.length;
          presentDays = logs.filter(([_, log]) => log.status === "Present" || log.status === "Late" || log.status === "Early Leave" || log.status === "Missing Punch").length;
          absentDays = logs.filter(([_, log]) => log.status === "Absent").length;
          lateDays = logs.filter(([_, log]) => log.status === "Late").length;
        }
      } else {
        if (emp.id === "EMP001") { presentDays = 24; absentDays = 1; lateDays = 1; paidLeave = 1; }
        else if (emp.id === "EMP002") { presentDays = 23; absentDays = 2; lateDays = 1; paidLeave = 1; }
      }

      return {
        id: emp.id, name: emp.name, dept: emp.department, designation: emp.designation || "",
        basic, allowances: allowanceAmount, allowanceItems, otHours, otAmount, gross,
        deductions: totalDeductions, deductionAmount, deductionItems,
        epf: epfEmployee, etf: etfEmployer, epfEmployer, tax, net, status: "Approved",
        attendanceSummary: { workDays, presentDays, absentDays, lateDays, halfDays, paidLeave, noPayDays, otHours: otHours > 0 ? `${otHours}h 00m` : "0h" }
      };
    });
  }, [dbEmployees, settingsData, selectedPeriod]);

  const handleGeneratePayroll = async () => {
    setIsCalculating(true);
    const computedEmployees = liveComputedEmployees;
    const totals = {
      totalEmployees: computedEmployees.length,
      basicCost: computedEmployees.reduce((sum, e) => sum + e.basic, 0),
      allowancesCost: computedEmployees.reduce((sum, e) => sum + e.allowances, 0),
      otCost: computedEmployees.reduce((sum, e) => sum + e.otAmount, 0),
      deductionsCost: computedEmployees.reduce((sum, e) => sum + e.deductions, 0),
      epfCost: computedEmployees.reduce((sum, e) => sum + e.epf, 0),
      etfCost: computedEmployees.reduce((sum, e) => sum + e.etf, 0),
      taxCost: computedEmployees.reduce((sum, e) => sum + e.tax, 0),
      netCost: computedEmployees.reduce((sum, e) => sum + e.net, 0)
    };
    const payrollRun = { period: selectedPeriod, status: "Approved", employees: computedEmployees, totals, updatedAt: new Date().toISOString() };
    setTimeout(async () => {
      try {
        await setDoc(doc(db, "payroll_runs", selectedPeriod), payrollRun);
      } catch (err) {
        console.error("Failed to save payroll run:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 1500);
  };

  const handleResetPayroll = async () => {
    try {
      await setDoc(doc(db, "payroll_runs", selectedPeriod), {
        status: "Pending",
        employees: [],
        totals: {
          totalEmployees: 0,
          basicCost: 0,
          allowancesCost: 0,
          otCost: 0,
          deductionsCost: 0,
          epfCost: 0,
          etfCost: 0,
          taxCost: 0,
          netCost: 0
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to reset payroll run:", err);
    }
  };

  // Dynamic department summaries — always live from computed employees
  const departmentSummaries = useMemo(() => {
    const list = liveComputedEmployees;
    const deptsMap: Record<string, any> = {};
    list.forEach((emp: any) => {
      if (!deptsMap[emp.dept]) {
        deptsMap[emp.dept] = { name: emp.dept, count: 0, basic: 0, allowances: 0, ot: 0, deductions: 0, net: 0 };
      }
      const d = deptsMap[emp.dept];
      d.count += 1;
      d.basic += emp.basic;
      d.allowances += emp.allowances;
      d.ot += emp.otAmount || 0;
      d.deductions += emp.deductions;
      d.net += emp.net;
    });
    return Object.values(deptsMap);
  }, [liveComputedEmployees]);

  // Dynamic employee breakdown logs — always live
  const employeePayrollPreview = useMemo(() => {
    return liveComputedEmployees.filter((item: any) => deptFilter === "All" || item.dept === deptFilter);
  }, [liveComputedEmployees, deptFilter]);

  const paginatedDepts = useMemo(() => {
    const startIndex = (deptPage - 1) * itemsPerPage;
    return departmentSummaries.slice(startIndex, startIndex + itemsPerPage);
  }, [deptPage]);

  const paginatedEmpPreviews = useMemo(() => {
    const startIndex = (empPayrollPage - 1) * itemsPerPage;
    return employeePayrollPreview.slice(startIndex, startIndex + itemsPerPage);
  }, [employeePayrollPreview, empPayrollPage]);

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

      {/* Detailed calculation variables & preview log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Employee Preview logs */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-3 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Employee Payroll Preview</h3>
                <p className="text-xs text-slate-400">Detailed line item calculation check</p>
                <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mt-1 inline-flex items-center gap-1">
                  <span>⚑</span> <strong>Statutory</strong> deductions (EPF 8% + Income Tax) are auto-applied by law. <strong>Custom</strong> deductions reflect assignments from the Allowances &amp; Deductions page. Hover any cell for breakdown.
                </p>
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
                    <th className="py-2.5 px-3 text-right">
                      <span className="inline-flex flex-col items-end gap-0">
                        <span>Statutory</span>
                        <span className="text-[9px] font-normal normal-case text-slate-300">EPF 8% + Tax</span>
                      </span>
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      <span className="inline-flex flex-col items-end gap-0">
                        <span>Custom</span>
                        <span className="text-[9px] font-normal normal-case text-slate-300">Assigned deductions</span>
                      </span>
                    </th>
                    <th className="py-2.5 px-3 text-right">Net Pay</th>
                    <th className="py-2.5 px-3 text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedEmpPreviews.map((emp: any) => {
                    const statutory = (emp.epf ?? 0) + (emp.tax ?? 0);
                    const custom = emp.deductionAmount ?? 0;
                    const statutoryTip = `EPF (8%): LKR ${(emp.epf ?? 0).toLocaleString()}\nIncome Tax: LKR ${(emp.tax ?? 0).toLocaleString()}`;
                    const customTip = (emp.deductionItems && emp.deductionItems.length > 0)
                      ? emp.deductionItems.map((d: any) => `${d.name}: LKR ${d.amount.toLocaleString()}`).join('\n')
                      : 'No custom deductions assigned';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/20">
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{emp.name}</span>
                            <span className="text-[9px] text-slate-400">{emp.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">LKR {(emp.basic ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-emerald-600">+LKR {(emp.allowances ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-indigo-600">+LKR {(emp.otAmount ?? emp.ot ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">LKR {(emp.gross ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-rose-600" title={statutoryTip}>
                          <span className="cursor-help border-b border-dashed border-rose-300">
                            -{statutory === 0 ? 'LKR 0' : `LKR ${statutory.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right" title={customTip}>
                          {custom > 0 ? (
                            <span className="text-orange-600 cursor-help border-b border-dashed border-orange-300">
                              -LKR {custom.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px] cursor-help" title={customTip}>—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">LKR {(emp.net ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-center">
                          <Link href={`/payslips?emp=${emp.id}&period=${encodeURIComponent(selectedPeriod)}`} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded inline-block transition-colors" title={`View Payslip – ${emp.name}`}>
                            <FileText className="h-4 w-4 mx-auto" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination for Employee Payroll Preview */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
              <span>
                Showing {employeePayrollPreview.length === 0 ? 0 : (empPayrollPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(empPayrollPage * itemsPerPage, employeePayrollPreview.length)} of {employeePayrollPreview.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEmpPayrollPage(p => Math.max(p - 1, 1))}
                  disabled={empPayrollPage === 1}
                  className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button className="px-2.5 py-1 bg-blue-600 text-white rounded-md">{empPayrollPage}</button>
                <button
                  onClick={() => setEmpPayrollPage(p => p + 1)}
                  disabled={empPayrollPage * itemsPerPage >= employeePayrollPreview.length}
                  className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
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
                {paginatedDepts.map((dept, index) => (
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
          {/* Pagination for Department Summaries */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>
              Showing {departmentSummaries.length === 0 ? 0 : (deptPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(deptPage * itemsPerPage, departmentSummaries.length)} of {departmentSummaries.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDeptPage(p => Math.max(p - 1, 1))}
                disabled={deptPage === 1}
                className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button className="px-2.5 py-1 bg-blue-600 text-white rounded-md">{deptPage}</button>
              <button
                onClick={() => setDeptPage(p => p + 1)}
                disabled={deptPage * itemsPerPage >= departmentSummaries.length}
                className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
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
    </div>
  );
}
