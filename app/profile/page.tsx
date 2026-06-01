"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Employee } from "@/lib/mockData";
import {
  User,
  Briefcase,
  Fingerprint,
  Building,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function ProfilePage() {
  const { user, employeeId, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    async function fetchProfile() {
      if (authLoading) return;
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        let foundEmployee: Employee | null = null;

        // 1. Try loading by mapped employeeId from AuthContext
        if (employeeId) {
          const empDocRef = doc(db, "employees", employeeId);
          const empDoc = await getDoc(empDocRef);
          if (empDoc.exists()) {
            foundEmployee = { id: empDoc.id, ...empDoc.data() } as Employee;
          }
        }

        // 2. Fallback: Search by email if employeeId is not set or doc wasn't found
        if (!foundEmployee && user.email) {
          const q = query(
            collection(db, "employees"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            foundEmployee = { id: firstDoc.id, ...firstDoc.data() } as Employee;
          }
        }

        setEmployee(foundEmployee);
      } catch (error) {
        console.error("Error fetching employee profile from Firestore:", error);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [user, employeeId, authLoading]);

  if (authLoading || loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 font-semibold text-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Loading your profile details...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6 text-center select-none animate-fade-in relative overflow-hidden my-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
            <AlertCircle className="h-9 w-9" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Unmapped Account</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Employee Profile Not Found</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
          <p>
            Your account email <span className="font-extrabold text-slate-800">{user?.email}</span> is not currently mapped to an employee record in our system.
          </p>
          <p className="mt-2 text-slate-400">
            Please contact the HR Department or System Administrator to link your user account to your Employee profile card.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center font-extrabold text-2xl text-white border border-white/20 shadow-inner">
            {employee.photo || employee.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <h2 className="text-xl font-extrabold tracking-tight">{employee.name}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold self-center ${
                employee.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"
              }`}>
                {employee.status}
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium">{employee.designation}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                {employee.department}
              </span>
              <span className="hidden md:inline">|</span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {employee.type} Employee
              </span>
              <span className="hidden md:inline">|</span>
              <span className="font-semibold">ID: {employee.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Detail Card */}
      <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === "personal" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
            }`}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("job")}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === "job" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
            }`}
          >
            Job Info
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === "bank" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
            }`}
          >
            Bank & EPF Details
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === "contact" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
            }`}
          >
            Contact Details
          </button>
        </div>

        {/* Info Grid */}
        <div className="p-6 md:p-8">
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Full Legal Name</span>
                <span className="font-bold text-slate-700">{employee.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">NIC / Passport</span>
                <span className="font-bold text-slate-700">{employee.nic}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Date of Birth</span>
                <span className="font-bold text-slate-700">{employee.dob}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Gender</span>
                <span className="font-bold text-slate-700">{employee.gender}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Marital Status</span>
                <span className="font-bold text-slate-700">{employee.maritalStatus}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Nationality</span>
                <span className="font-bold text-slate-700">{employee.nationality}</span>
              </div>
            </div>
          )}

          {activeTab === "job" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Joined Date</span>
                <span className="font-bold text-slate-700">{employee.joinedDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Employment Type</span>
                <span className="font-bold text-slate-700">{employee.type}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Department</span>
                <span className="font-bold text-slate-700">{employee.department}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Designation</span>
                <span className="font-bold text-slate-700">{employee.designation}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 col-span-1 md:col-span-2">
                <span className="text-slate-400 font-semibold">BioStar 2 Fingerprint ID</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <Fingerprint className="h-4 w-4" />
                  {employee.biostarId || "Not Registered"}
                </span>
              </div>
            </div>
          )}

          {activeTab === "bank" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Salary Contract Type</span>
                <span className="font-bold text-slate-700">{employee.salaryType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">Basic Salary</span>
                <span className="font-bold text-slate-700 font-mono text-xs">
                  LKR {employee.basicSalary ? employee.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">EPF Registration No.</span>
                <span className="font-bold text-slate-700">{employee.epfNumber || "Not Registered"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-semibold">ETF Registration No.</span>
                <span className="font-bold text-slate-700">{(employee as any).etfNumber || "Not Registered"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 col-span-1 md:col-span-2">
                <span className="text-slate-400 font-semibold">Bank Name</span>
                <span className="font-bold text-slate-700">{(employee as any).bankName || "Commercial Bank"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 col-span-1 md:col-span-2">
                <span className="text-slate-400 font-semibold">Account Number</span>
                <span className="font-bold text-slate-700 font-mono">{(employee as any).bankAccount || "1234 5678 9012"}</span>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-400 font-semibold">Mobile Number</span>
                  <span className="font-bold text-slate-700">{employee.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-400 font-semibold">Work Email</span>
                  <span className="font-bold text-slate-700">{employee.email || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2 border-b border-slate-100 pb-3">
                  <span className="text-slate-400 font-semibold">Residential Address</span>
                  <span className="font-bold text-slate-700 leading-relaxed">{employee.address}</span>
                </div>
              </div>

              {/* Emergency contact box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 max-w-md space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Contact Person</p>
                <div className="flex justify-between border-b border-slate-100/50 pb-2">
                  <span className="text-slate-500">Contact Name</span>
                  <span className="font-bold text-slate-700">{employee.emergencyContact?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100/50 pb-2">
                  <span className="text-slate-500">Relationship</span>
                  <span className="font-bold text-slate-700">{employee.emergencyContact?.relationship || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Phone</span>
                  <span className="font-bold text-blue-600">{employee.emergencyContact?.phone || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
