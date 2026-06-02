"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Mail,
  Download,
  Printer,
  AlertCircle,
  Fingerprint,
  CheckCircle,
  Loader2
} from "lucide-react";
import { mockEmployees } from "@/lib/mockData";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import Link from "next/link";

function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";

  function g(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "");
  }

  function h(n: number): string {
    if (n < 100) return g(n);
    const rest = n % 100;
    return a[Math.floor(n / 100)] + " Hundred" + (rest ? " and " + g(rest) : "");
  }

  let word = "";
  let temp = Math.floor(num);

  if (temp >= 100000) {
    word += h(Math.floor(temp / 100000)) + " Lakh ";
    temp %= 100000;
  }
  if (temp >= 1000) {
    word += h(Math.floor(temp / 1000)) + " Thousand ";
    temp %= 1000;
  }
  if (temp > 0) {
    word += h(temp);
  }

  return word.trim() + " Rupees Only";
}

function PayslipsPageInner() {
  const searchParams = useSearchParams();
  const paramEmp = searchParams.get("emp");
  const paramPeriod = searchParams.get("period");

  const [selectedPeriod, setSelectedPeriod] = useState(paramPeriod || "May 2024");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedEmpId, setSelectedEmpId] = useState(paramEmp || "EMP001");
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  const [payrollRun, setPayrollRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<string[]>(["May 2024", "April 2024"]);

  // Sync selected period's payroll run
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, "payroll_runs", selectedPeriod), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPayrollRun(data);
        if (data.employees && data.employees.length > 0) {
          const empExists = data.employees.some((e: any) => e.id === selectedEmpId);
          if (!empExists) {
            setSelectedEmpId(data.employees[0].id);
          }
        }
      } else {
        setPayrollRun(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching payroll run:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [selectedPeriod]);

  // When URL params change (e.g. navigating from payroll page), update selections
  useEffect(() => {
    if (paramEmp) setSelectedEmpId(paramEmp);
    if (paramPeriod) setSelectedPeriod(paramPeriod);
  }, [paramEmp, paramPeriod]);

  // Sync available periods from payroll_runs collection to populate dropdowns
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payroll_runs"), (snapshot) => {
      const runPeriods: string[] = [];
      snapshot.forEach((doc) => {
        runPeriods.push(doc.id);
      });
      if (runPeriods.length > 0) {
        const combined = Array.from(new Set([...runPeriods, "May 2024", "April 2024"]));
        setPeriods(combined);
      }
    });
    return () => unsub();
  }, []);

  // Compute live list of employee data (loaded run or fallback to draft calculated)
  const employeesList = useMemo(() => {
    if (payrollRun && payrollRun.employees && payrollRun.employees.length > 0) {
      return payrollRun.employees;
    }
    return mockEmployees.map(emp => {
      const travel = emp.id === "EMP001" ? 15000 : 10000;
      const meal = 10000;
      const performance = emp.id === "EMP001" ? 20000 : 12000;
      const phone = 8000;
      const fuel = emp.id === "EMP001" ? 12000 : 0;
      const special = emp.id === "EMP001" ? 5000 : 0;
      const allowanceAmount = travel + meal + performance + phone + fuel + special;

      const loan = emp.id === "EMP001" ? 10000 : 0;
      const late = emp.id === "EMP002" ? 1500 : 0;
      const welfare = 500;
      const deductionAmount = loan + late + welfare;

      const basic = emp.basicSalary;
      const epfEmployee = basic * 0.08;
      const epfEmployer = basic * 0.12;
      const etfEmployer = basic * 0.03;

      const calcTax = (income: number) => {
        if (income <= 100000) return 0;
        const taxable = income - 100000;
        if (taxable <= 41667) return taxable * 0.06;
        if (taxable <= 83334) return 41667 * 0.06 + (taxable - 41667) * 0.12;
        return 41667 * 0.06 + 41667 * 0.12 + (taxable - 83334) * 0.18;
      };

      const otHours = emp.id === "EMP001" ? 3 : emp.id === "EMP004" ? 8 : 0;
      const otAmount = emp.id === "EMP001" ? 3600 : emp.id === "EMP004" ? 16000 : 0;

      const gross = basic + allowanceAmount + otAmount;
      const tax = calcTax(gross);
      const totalDeductions = deductionAmount + epfEmployee + tax;
      const net = gross - totalDeductions;

      return {
        id: emp.id,
        name: emp.name,
        dept: emp.department,
        designation: emp.designation,
        basic,
        allowances: allowanceAmount,
        allowanceItems: [
          { name: "Travel Allowance", amount: travel },
          { name: "Meal Allowance", amount: meal },
          { name: "Performance Allowance", amount: performance },
          { name: "Phone Allowance", amount: phone },
          ...(fuel > 0 ? [{ name: "Fuel Allowance", amount: fuel }] : []),
          ...(special > 0 ? [{ name: "Special Allowance", amount: special }] : [])
        ],
        otHours,
        otAmount,
        gross,
        deductions: totalDeductions,
        deductionAmount,
        deductionItems: [
          ...(loan > 0 ? [{ name: "Loan Installment", amount: loan }] : []),
          ...(late > 0 ? [{ name: "Late Attendance Deduction", amount: late }] : []),
          { name: "Welfare Fund", amount: welfare }
        ],
        epf: epfEmployee,
        etf: etfEmployer,
        epfEmployer,
        tax,
        net,
        attendanceSummary: {
          workDays: 26,
          presentDays: emp.id === "EMP001" ? 24 : emp.id === "EMP002" ? 23 : 26,
          absentDays: emp.id === "EMP001" ? 1 : emp.id === "EMP002" ? 2 : 0,
          lateDays: emp.id === "EMP001" ? 1 : emp.id === "EMP002" ? 1 : 0,
          halfDays: 0,
          paidLeave: emp.id === "EMP001" ? 1 : emp.id === "EMP002" ? 1 : 0,
          noPayDays: 0,
          otHours: otHours > 0 ? `${otHours}h 00m` : "0h"
        }
      };
    });
  }, [payrollRun]);

  // Unique departments for filter
  const departments = useMemo<string[]>(() => {
    return ["All", ...Array.from(new Set<string>(employeesList.map((emp: any) => (emp.dept || emp.department || "") as string)))];
  }, [employeesList]);

  // Filter employees for selector
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp: any) => {
      const dept = emp.dept || emp.department;
      return selectedDept === "All" || dept === selectedDept;
    });
  }, [selectedDept, employeesList]);

  // Find active employee record
  const activeEmployee = useMemo(() => {
    return filteredEmployees.find((emp: any) => emp.id === selectedEmpId) || filteredEmployees[0] || employeesList[0];
  }, [selectedEmpId, filteredEmployees, employeesList]);

  const handleSendEmail = () => {
    if (!activeEmployee) return;
    setIsSending(true);
    setEmailStatus("");
    setTimeout(() => {
      setIsSending(false);
      setEmailStatus("Payslip sent successfully to " + (activeEmployee.name || "").toLowerCase().replace(/\s+/g, "") + "@payrollex.com");
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 select-none print:bg-white print:p-0">
      {/* Search Header - Hidden on print */}
      <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Pay Period</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
            >
              {periods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Department</span>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                const filtered = employeesList.filter((emp: any) => {
                  const dept = emp.dept || emp.department;
                  return e.target.value === "All" || dept === e.target.value;
                });
                if (filtered.length > 0) setSelectedEmpId(filtered[0].id);
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white focus:outline-none"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== "All").map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Select Employee</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none min-w-[180px]"
            >
              {filteredEmployees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 bg-white cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 bg-white cursor-pointer"
          >
            <Mail className="h-4 w-4" /> Email Payslip
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {emailStatus && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 print:hidden animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span className="font-bold">{emailStatus}</span>
        </div>
      )}

      {/* Alert if payroll run is draft / not approved yet */}
      {!loading && !payrollRun && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 print:hidden animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Payroll Draft Alert: </span>
            <span>Payroll has not been generated or approved for <strong>{selectedPeriod}</strong> yet. Showing preview using draft configurations. Please generate payroll in the <Link href="/payroll" className="underline font-bold hover:text-amber-950">Payroll Processing</Link> section to finalize.</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-card-border shadow-xs min-h-[300px]">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase mt-3">Loading payslip details...</span>
        </div>
      ) : activeEmployee ? (
        /* Main Container Grid */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Printable Payslip Panel - 3 cols */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-card-border shadow-xs lg:col-span-3 space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Company details Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">ABC (Pvt) Ltd</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">123, Business Park, Colombo 05, Sri Lanka</span>
                  <span className="text-[9px] text-slate-400 font-medium">Tel: +94 11 234 5678 | Reg No: PV 123456</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-800 tracking-tight block">PAYSLIP</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Confidential</span>
                <span className="text-xs font-bold text-blue-600 mt-1 inline-block">{selectedPeriod}</span>
              </div>
            </div>

            {/* Employee & salary summary details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100/60 print:bg-white print:border-slate-200">
              {/* Employee Details Column */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Details</h4>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium col-span-1">Employee ID</span>
                  <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.id}</span>
                  
                  <span className="text-slate-500 font-medium col-span-1">Full Name</span>
                  <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.name}</span>
                  
                  <span className="text-slate-500 font-medium col-span-1">Designation</span>
                  <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.designation || "Executive"}</span>
                  
                  <span className="text-slate-500 font-medium col-span-1">Department</span>
                  <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.dept || activeEmployee.department}</span>
                </div>
              </div>

              {/* Salary Details Column */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details</h4>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium col-span-1">Bank Name</span>
                  <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.bankName || "Commercial Bank"}</span>
                  
                  <span className="text-slate-500 font-medium col-span-1">Account No</span>
                  <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.accountNo || "**** **** 9012"}</span>
                  
                  <span className="text-slate-500 font-medium col-span-1">Payment Mode</span>
                  <span className="font-bold text-slate-700 col-span-2">: Bank Transfer</span>
                  
                  <span className="text-slate-500 font-medium col-span-1">Payment Date</span>
                  <span className="font-bold text-slate-700 col-span-2">: {selectedPeriod === "May 2024" ? "May 31, 2024" : selectedPeriod === "April 2024" ? "April 30, 2024" : "End of Month"}</span>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            {activeEmployee.attendanceSummary && (
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Summary</h4>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3 text-center text-xs">
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">Work Days</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.workDays}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">Present</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.presentDays}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">Absent</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.absentDays}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">Late Days</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.lateDays}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">Half Days</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.halfDays}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">Paid Leave</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.paidLeave}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">No-Pay Days</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.noPayDays}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                    <span className="text-slate-400 font-medium text-[9px] block">OT Hours</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{activeEmployee.attendanceSummary.otHours}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings vs Deductions breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Earnings Section */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Earnings & Allowances
                </div>
                <div className="divide-y divide-slate-50 text-xs">
                  <div className="flex justify-between px-4 py-2 font-bold text-slate-700">
                    <span>Basic Salary</span>
                    <span>{activeEmployee.basic.toLocaleString()}.00</span>
                  </div>
                  {activeEmployee.allowanceItems?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between px-4 py-2 text-slate-600">
                      <span>{item.name}</span>
                      <span>{item.amount.toLocaleString()}.00</span>
                    </div>
                  ))}
                  {activeEmployee.otAmount > 0 && (
                    <div className="flex justify-between px-4 py-2 text-slate-600">
                      <span>Overtime Pay ({activeEmployee.attendanceSummary?.otHours || `${activeEmployee.otHours}h 00m`})</span>
                      <span>{activeEmployee.otAmount.toLocaleString()}.00</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-2.5 bg-blue-50/20 font-bold text-blue-800 border-t border-slate-100">
                    <span>Gross Earnings</span>
                    <span>LKR {activeEmployee.gross.toLocaleString()}.00</span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Deductions
                  </div>
                  <div className="divide-y divide-slate-50 text-xs">
                    {activeEmployee.deductionItems?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between px-4 py-2 text-slate-600">
                        <span>{item.name}</span>
                        <span>{item.amount.toLocaleString()}.00</span>
                      </div>
                    ))}
                    {activeEmployee.tax > 0 && (
                      <div className="flex justify-between px-4 py-2 text-slate-600">
                        <span>PAYE Tax</span>
                        <span>{activeEmployee.tax.toLocaleString()}.00</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2.5 bg-rose-50/20 font-bold text-rose-800 border-t border-slate-100">
                      <span>Total Deductions</span>
                      <span>LKR {activeEmployee.deductions.toLocaleString()}.00</span>
                    </div>
                  </div>
                </div>

                {/* Statutory Deductions */}
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Statutory Deductions (EPF/ETF)
                  </div>
                  <div className="divide-y divide-slate-50 text-xs">
                    <div className="flex justify-between px-4 py-2 text-slate-600">
                      <span>EPF (Employee Contribution 8%)</span>
                      <span>{activeEmployee.epf.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between px-4 py-2 text-[10px] text-slate-400">
                      <span>ETF (Employer Contribution 3%)*</span>
                      <span>{activeEmployee.etf.toLocaleString()}.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Calculation & Words */}
            <div className="p-5 bg-blue-900 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Net Payable Salary</span>
                <p className="text-xs text-blue-100 font-semibold leading-normal">
                  Net Pay in Words: <span className="text-white italic">{numberToWords(activeEmployee.net || 0)}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold tracking-tight">LKR {activeEmployee.net.toLocaleString()}.00</span>
              </div>
            </div>

            {/* Footer remarks */}
            <div className="text-center pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
              <p className="font-bold uppercase tracking-wider">Confidential Documents - Private distribution</p>
              <p className="font-semibold">This is a computer generated payslip and does not require a signature.</p>
              <p className="text-[11px] text-slate-500 font-bold mt-2">Thank you for your valuable contribution!</p>
            </div>
          </div>

          {/* Right sidebar: Payslip Delivery status & send panel */}
          <div className="space-y-6 print:hidden">
            {/* History */}
            <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-3">
                Payslip History
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                  <span className="font-bold text-slate-700">May 2024</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">Generated</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                  <span className="font-bold text-slate-700">April 2024</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">Generated</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                  <span className="font-bold text-slate-700">March 2024</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">Generated</span>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white p-5 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
              <div className="space-y-3.5 text-xs">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">
                  Payslip Delivery
                </h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Email</label>
                  <input
                    type="email"
                    readOnly
                    value={`${(activeEmployee.name || "").toLowerCase().replace(/\s+/g, "")}@payrollex.com`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-500 bg-slate-50 font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Download Status</label>
                  <p className="font-bold text-slate-700">Available to download as PDF</p>
                </div>
              </div>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-75"
              >
                <Mail className="h-4 w-4" />
                {isSending ? "Sending Email..." : "Send Payslip to Employee"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs text-center text-xs text-slate-400 font-bold uppercase py-20 min-h-[300px] flex items-center justify-center">
          No employee selected or available.
        </div>
      )}
    </div>
  );
}

export default function PayslipsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400 text-xs font-semibold">Loading payslip...</div>}>
      <PayslipsPageInner />
    </Suspense>
  );
}
