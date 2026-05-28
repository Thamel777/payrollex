"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Mail,
  Download,
  Search,
  Building,
  Printer,
  ChevronRight,
  Send,
  AlertCircle,
  Fingerprint,
  CheckCircle
} from "lucide-react";
import { mockEmployees, Employee } from "@/lib/mockData";

export default function PayslipsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("May 2024");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedEmpId, setSelectedEmpId] = useState("EMP001");
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  // Unique departments for filter
  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(mockEmployees.map(emp => emp.department)))];
  }, []);

  // Filter employees for selector
  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter(emp => {
      return selectedDept === "All" || emp.department === selectedDept;
    });
  }, [selectedDept]);

  // Find active employee record
  const activeEmployee = useMemo(() => {
    return mockEmployees.find(emp => emp.id === selectedEmpId) || mockEmployees[0];
  }, [selectedEmpId]);

  // Calculate earnings, deductions, net salary based on employee
  const payrollDetails = useMemo(() => {
    const basic = activeEmployee.basicSalary;
    
    // Earnings/Allowances
    const travel = activeEmployee.id === "EMP001" ? 15000 : 10000;
    const meal = 10000;
    const performance = activeEmployee.id === "EMP001" ? 20000 : 12000;
    const phone = 8000;
    const fuel = activeEmployee.id === "EMP001" ? 12000 : 0;
    const special = activeEmployee.id === "EMP001" ? 5000 : 0;

    const totalAllowances = travel + meal + performance + phone + fuel + special;
    const grossEarnings = basic + totalAllowances;

    // Deductions
    const loan = activeEmployee.id === "EMP001" ? 10000 : 0;
    const salaryAdvance = 0;
    const late = activeEmployee.id === "EMP002" ? 1500 : 0;
    const damage = 0;
    const welfare = 500;
    const other = 0;

    const totalDeductions = loan + salaryAdvance + late + damage + welfare + other;

    // Statutory (EPF 8%, ETF 3%)
    const epf = basic * 0.08;
    const etf = basic * 0.03;
    const totalStatutory = epf + etf;

    // Net pay
    const netPay = grossEarnings - totalDeductions - epf; // standard net salary formula (Gross - Deductions - EPF Employee portion)

    return {
      basic,
      travel,
      meal,
      performance,
      phone,
      fuel,
      special,
      totalAllowances,
      grossEarnings,
      loan,
      salaryAdvance,
      late,
      damage,
      welfare,
      other,
      totalDeductions,
      epf,
      etf,
      totalStatutory,
      netPay
    };
  }, [activeEmployee]);

  const handleSendEmail = () => {
    setIsSending(true);
    setEmailStatus("");
    setTimeout(() => {
      setIsSending(false);
      setEmailStatus("Payslip sent successfully to " + activeEmployee.name.toLowerCase().replace(" ", "") + "@payrollex.com");
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
              <option value="May 2024">May 2024</option>
              <option value="April 2024">April 2024</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Department</span>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                // Reset employee selection to first filtered employee
                const filtered = mockEmployees.filter(emp => e.target.value === "All" || emp.department === e.target.value);
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
              {filteredEmployees.map(emp => (
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
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 print:hidden">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span className="font-bold">{emailStatus}</span>
        </div>
      )}

      {/* Main Container Grid */}
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
                <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.designation}</span>
                
                <span className="text-slate-500 font-medium col-span-1">Department</span>
                <span className="font-bold text-slate-700 col-span-2">: {activeEmployee.department}</span>
              </div>
            </div>

            {/* Salary Details Column */}
            <div className="space-y-2 text-xs">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details</h4>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium col-span-1">Bank Name</span>
                <span className="font-bold text-slate-700 col-span-2">: Commercial Bank</span>
                
                <span className="text-slate-500 font-medium col-span-1">Account No</span>
                <span className="font-bold text-slate-700 col-span-2">: **** **** 9012</span>
                
                <span className="text-slate-500 font-medium col-span-1">Payment Mode</span>
                <span className="font-bold text-slate-700 col-span-2">: Bank Transfer</span>
                
                <span className="text-slate-500 font-medium col-span-1">Payment Date</span>
                <span className="font-bold text-slate-700 col-span-2">: May 31, 2024</span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Summary</h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 text-center text-xs">
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">Work Days</span>
                <span className="font-bold text-slate-700 block mt-0.5">26</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">Present</span>
                <span className="font-bold text-slate-700 block mt-0.5">24</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">Absent</span>
                <span className="font-bold text-slate-700 block mt-0.5">1</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">Late Days</span>
                <span className="font-bold text-slate-700 block mt-0.5">1</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">Half Days</span>
                <span className="font-bold text-slate-700 block mt-0.5">0</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">Paid Leave</span>
                <span className="font-bold text-slate-700 block mt-0.5">1</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">No-Pay Days</span>
                <span className="font-bold text-slate-700 block mt-0.5">0</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                <span className="text-slate-400 font-medium text-[9px] block">OT Hours</span>
                <span className="font-bold text-slate-700 block mt-0.5">12h 30m</span>
              </div>
            </div>
          </div>

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
                  <span>{payrollDetails.basic.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-slate-600">
                  <span>Travel Allowance</span>
                  <span>{payrollDetails.travel.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-slate-600">
                  <span>Meal Allowance</span>
                  <span>{payrollDetails.meal.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-slate-600">
                  <span>Performance Allowance</span>
                  <span>{payrollDetails.performance.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-slate-600">
                  <span>Phone Allowance</span>
                  <span>{payrollDetails.phone.toLocaleString()}.00</span>
                </div>
                {payrollDetails.fuel > 0 && (
                  <div className="flex justify-between px-4 py-2 text-slate-600">
                    <span>Fuel Allowance</span>
                    <span>{payrollDetails.fuel.toLocaleString()}.00</span>
                  </div>
                )}
                {payrollDetails.special > 0 && (
                  <div className="flex justify-between px-4 py-2 text-slate-600">
                    <span>Special Allowance</span>
                    <span>{payrollDetails.special.toLocaleString()}.00</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2.5 bg-blue-50/20 font-bold text-blue-800 border-t border-slate-100">
                  <span>Gross Earnings</span>
                  <span>LKR {payrollDetails.grossEarnings.toLocaleString()}.00</span>
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
                  {payrollDetails.loan > 0 && (
                    <div className="flex justify-between px-4 py-2 text-slate-600">
                      <span>Loan Installment</span>
                      <span>{payrollDetails.loan.toLocaleString()}.00</span>
                    </div>
                  )}
                  {payrollDetails.late > 0 && (
                    <div className="flex justify-between px-4 py-2 text-slate-600">
                      <span>Late Attendance Deduction</span>
                      <span>{payrollDetails.late.toLocaleString()}.00</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-2 text-slate-600">
                    <span>Welfare Fund</span>
                    <span>{payrollDetails.welfare.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 bg-rose-50/20 font-bold text-rose-800 border-t border-slate-100">
                    <span>Total Deductions</span>
                    <span>LKR {payrollDetails.totalDeductions.toLocaleString()}.00</span>
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
                    <span>{payrollDetails.epf.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-[10px] text-slate-400">
                    <span>ETF (Employer Contribution 3%)*</span>
                    <span>{payrollDetails.etf.toLocaleString()}.00</span>
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
                Net Pay in Words: <span className="text-white italic">Three Hundred Forty Two Thousand Five Hundred Rupees Only.</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold tracking-tight">LKR {payrollDetails.netPay.toLocaleString()}.00</span>
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
                  value={`${activeEmployee.name.toLowerCase().replace(" ", "")}@payrollex.com`}
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
    </div>
  );
}
