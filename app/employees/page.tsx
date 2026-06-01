"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Building,
  UserPlus,
  Fingerprint,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  X,
  Plus,
  Briefcase,
  FileSpreadsheet,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import { mockEmployees, Employee } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function EmployeesPage() {
  const { user, role, employeeId } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formEmp, setFormEmp] = useState<Partial<Employee>>({
    id: "",
    name: "",
    department: "IT Department",
    designation: "",
    type: "Permanent",
    status: "Active",
    biostarId: "",
    nic: "",
    dob: "",
    gender: "Male",
    maritalStatus: "Single",
    nationality: "Sri Lankan",
    joinedDate: "",
    salaryType: "Monthly",
    basicSalary: 0,
    epfNumber: "",
    address: "",
    email: "",
    phone: "",
    emergencyContact: { name: "", relationship: "", phone: "" }
  });

  // Role Gating
  const canAddEdit = role === "Admin" || role === "HR Manager";
  const canDelete = role === "Admin" || role === "HR Manager";

  // Check if current user is allowed to view salary of this specific employee
  const canViewSalaryOf = (emp: Employee) => {
    if (role === "Admin" || role === "HR Manager" || role === "Accounts Officer") {
      return true;
    }
    // User viewing their own record
    if (employeeId && employeeId === emp.id) {
      return true;
    }
    if (user?.email && emp.email && user.email.toLowerCase() === emp.email.toLowerCase()) {
      return true;
    }
    return false;
  };

  // Sync / load employees from Firestore (and seed if empty)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), async (snapshot) => {
      if (snapshot.empty) {
        setLoading(true);
        console.log("Employees collection is empty. Seeding mock data...");
        try {
          for (const emp of mockEmployees) {
            await setDoc(doc(db, "employees", emp.id), emp);
          }
        } catch (e) {
          console.error("Failed to seed employees:", e);
        }
      } else {
        const list: Employee[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Employee);
        });
        
        // Sort by employee ID prefix numerically if possible, otherwise string sort
        list.sort((a, b) => {
          const aNum = parseInt(a.id.replace(/\D/g, "")) || 0;
          const bNum = parseInt(b.id.replace(/\D/g, "")) || 0;
          return aNum - bNum;
        });

        setEmployees(list);
        
        // Handle selecting default / updated employee record
        setSelectedEmp((prev) => {
          if (prev) {
            return list.find((e) => e.id === prev.id) || list[0] || null;
          }
          return list[0] || null;
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot subscription failed:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Extract unique departments for filters
  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(employees.map(emp => emp.department)))];
  }, [employees]);

  // Filter employees based on search, department, and status
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.biostarId && emp.biostarId.includes(searchTerm));
      const matchesDept = deptFilter === "All" || emp.department === deptFilter;
      const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, deptFilter, statusFilter]);

  const handleOpenAdd = () => {
    setModalMode("add");
    setFormEmp({
      id: "",
      name: "",
      department: "IT Department",
      designation: "",
      type: "Permanent",
      status: "Active",
      biostarId: "",
      nic: "",
      dob: "",
      gender: "Male",
      maritalStatus: "Single",
      nationality: "Sri Lankan",
      joinedDate: new Date().toISOString().split("T")[0],
      salaryType: "Monthly",
      basicSalary: 0,
      epfNumber: "",
      address: "",
      email: "",
      phone: "",
      emergencyContact: { name: "", relationship: "", phone: "" }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setModalMode("edit");
    // Ensure all optional fields exist in the form state
    setFormEmp({
      ...emp,
      emergencyContact: emp.emergencyContact || { name: "", relationship: "", phone: "" }
    });
    setShowModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmp.name || !formEmp.designation) {
      alert("Please fill out name and designation");
      return;
    }

    try {
      if (modalMode === "add") {
        // Generate automatic employee ID prefixing EMP followed by 3 digits
        let nextIdNum = 1;
        if (employees.length > 0) {
          const numericIds = employees
            .map(emp => {
              const match = emp.id.match(/\d+/);
              return match ? parseInt(match[0]) : 0;
            })
            .filter(n => n > 0);
          if (numericIds.length > 0) {
            nextIdNum = Math.max(...numericIds) + 1;
          }
        }
        const newId = `EMP${String(nextIdNum).padStart(3, "0")}`;
        const photoInitials = formEmp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

        const freshEmployee: Employee = {
          ...(formEmp as Employee),
          id: newId,
          photo: photoInitials,
          basicSalary: Number(formEmp.basicSalary) || 0
        };

        await setDoc(doc(db, "employees", newId), freshEmployee);
        setSelectedEmp(freshEmployee);
      } else {
        const id = formEmp.id!;
        const updatedData = {
          ...formEmp,
          basicSalary: Number(formEmp.basicSalary) || 0
        };
        // Remove document id before writing to payload
        delete updatedData.id;

        await updateDoc(doc(db, "employees", id), updatedData);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving employee record:", err);
      alert("Error saving record: " + (err as Error).message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm(`Are you sure you want to delete employee ${id}?`)) {
      try {
        await deleteDoc(doc(db, "employees", id));
        if (selectedEmp?.id === id) {
          setSelectedEmp(null);
        }
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("Failed to delete record: " + (err as Error).message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 font-semibold text-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Syncing employees with database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top statistics section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">{employees.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Employees</span>
            <p className="text-lg font-bold text-emerald-600 leading-none mt-0.5">
              {employees.filter(e => e.status === "Active").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New This Month</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">8</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">{departments.length - 1}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs col-span-2 lg:col-span-1 flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BioStar 2 Mapped</span>
            <p className="text-lg font-bold text-slate-800 leading-none mt-0.5">
              {employees.filter(e => e.biostarId).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table list - takes 2 cols on wide screens */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header filters */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search box */}
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, EMP ID, device ID..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Dept Filter */}
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

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" /> Export
                </button>
                {canAddEdit && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Employee
                  </button>
                )}
              </div>
            </div>

            {/* Employee Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-4">EMP ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">BioStar ID</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmp(emp)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedEmp?.id === emp.id ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-800">{emp.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0 border border-slate-200">
                              {emp.photo}
                            </div>
                            <span className="font-bold text-slate-700 hover:text-blue-600">{emp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{emp.department}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{emp.designation}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-500">{emp.type}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.status === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-600 flex items-center gap-1">
                            <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                            {emp.biostarId || "Unmapped"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedEmp(emp)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canAddEdit && (
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                                title="Edit Details"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        No employees found matching the filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing 1 to {filteredEmployees.length} of {filteredEmployees.length} entries</span>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-2.5 py-1 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Previous</button>
              <button className="px-2.5 py-1 bg-blue-600 text-white rounded-md">1</button>
              <button disabled className="px-2.5 py-1 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>

        {/* Sliding detail drawer - taking 1 col */}
        <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col min-h-[30rem]">
          {selectedEmp ? (
            <div className="flex-1 flex flex-col">
              {/* Header profile banner */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg text-white border border-white/20">
                      {selectedEmp.photo}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold tracking-tight">{selectedEmp.name}</h3>
                      <p className="text-xs text-slate-300 font-medium">{selectedEmp.designation}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className={`inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-bold ${selectedEmp.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"}`}>
                          {selectedEmp.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">| ID: {selectedEmp.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                    activeTab === "personal" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab("job")}
                  className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                    activeTab === "job" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Job Info
                </button>
                <button
                  onClick={() => setActiveTab("bank")}
                  className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                    activeTab === "bank" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Bank & EPF
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                    activeTab === "contact" ? "border-blue-600 text-blue-600 bg-white font-extrabold" : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Contact
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {activeTab === "personal" && (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Full Name</span>
                      <span className="font-bold text-slate-700 text-right">{selectedEmp.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">NIC / Passport</span>
                      <span className="font-bold text-slate-700">{selectedEmp.nic}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Date of Birth</span>
                      <span className="font-bold text-slate-700">{selectedEmp.dob}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Gender</span>
                      <span className="font-bold text-slate-700">{selectedEmp.gender}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Marital Status</span>
                      <span className="font-bold text-slate-700">{selectedEmp.maritalStatus}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Nationality</span>
                      <span className="font-bold text-slate-700">{selectedEmp.nationality}</span>
                    </div>
                  </div>
                )}

                {activeTab === "job" && (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Date of Joining</span>
                      <span className="font-bold text-slate-700">{selectedEmp.joinedDate}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Employment Type</span>
                      <span className="font-bold text-slate-700">{selectedEmp.type}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Salary Type</span>
                      <span className="font-bold text-slate-700">{selectedEmp.salaryType}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">BioStar 2 User ID</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1">
                        <Fingerprint className="h-4 w-4 shrink-0" />
                        {selectedEmp.biostarId || "Not Mapped"}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "bank" && (
                  <div className="space-y-3.5 text-xs">
                    {canViewSalaryOf(selectedEmp) ? (
                      <>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-semibold">EPF Number</span>
                          <span className="font-bold text-slate-700">{selectedEmp.epfNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-semibold">ETF Number</span>
                          <span className="font-bold text-slate-700">{(selectedEmp as any).etfNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-semibold">Bank Name</span>
                          <span className="font-bold text-slate-700">{(selectedEmp as any).bankName || "Commercial Bank"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-semibold">Account Number</span>
                          <span className="font-bold text-slate-700">{(selectedEmp as any).bankAccount || "1234 5678 9012"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-semibold">Basic Salary</span>
                          <span className="font-bold text-slate-700">LKR {selectedEmp.basicSalary ? selectedEmp.basicSalary.toLocaleString() : "0.00"}</span>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-slate-400 space-y-2">
                        <Lock className="h-8 w-8 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-600">Details Restricted</p>
                        <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto leading-normal">
                          You do not have permission to view salary and bank information.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "contact" && (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Email</span>
                      <span className="font-bold text-slate-700">{selectedEmp.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Phone</span>
                      <span className="font-bold text-slate-700">{selectedEmp.phone || "N/A"}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Name</span>
                        <span className="font-bold text-slate-700">{selectedEmp.emergencyContact?.name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Relationship</span>
                        <span className="font-bold text-slate-700">{selectedEmp.emergencyContact?.relationship || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Contact Number</span>
                        <span className="font-bold text-blue-600">{selectedEmp.emergencyContact?.phone || "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 font-semibold">Residential Address</span>
                      <span className="font-bold text-slate-700 leading-normal">{selectedEmp.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action drawer footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                {canAddEdit && (
                  <button
                    onClick={() => handleOpenEdit(selectedEmp)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-slate-300">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">No Employee Selected</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Click on an employee row to view their full profile details, bank accounts, and sync credentials.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {modalMode === "add" ? (
                  <>
                    <UserPlus className="h-4.5 w-4.5 text-blue-600" />
                    Add New Employee Profile
                  </>
                ) : (
                  <>
                    <Pencil className="h-4.5 w-4.5 text-blue-600" />
                    Edit Employee Profile (ID: {formEmp.id})
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* SECTION 1: Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1">1. Personal Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formEmp.name || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="E.g. Nimal Perera"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIC / Passport</label>
                    <input
                      type="text"
                      required
                      value={formEmp.nic || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, nic: e.target.value }))}
                      placeholder="E.g. 199123456789"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={formEmp.dob || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                    <select
                      value={formEmp.gender || "Male"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marital Status</label>
                    <select
                      value={formEmp.maritalStatus || "Single"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, maritalStatus: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nationality</label>
                    <input
                      type="text"
                      required
                      value={formEmp.nationality || "Sri Lankan"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Job details */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1">2. Job & Integration Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                    <select
                      value={formEmp.department || "IT Department"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="IT Department">IT Department</option>
                      <option value="HR Department">HR Department</option>
                      <option value="Finance Department">Finance Department</option>
                      <option value="Marketing Department">Marketing Department</option>
                      <option value="Operations Department">Operations Department</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</label>
                    <input
                      type="text"
                      required
                      value={formEmp.designation || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, designation: e.target.value }))}
                      placeholder="E.g. Senior Software Engineer"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Type</label>
                    <select
                      value={formEmp.type || "Permanent"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Status</label>
                    <select
                      value={formEmp.status || "Active"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Joining</label>
                    <input
                      type="date"
                      required
                      value={formEmp.joinedDate || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, joinedDate: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BioStar 2 ID (Fingerprint)</label>
                    <input
                      type="text"
                      value={formEmp.biostarId || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, biostarId: e.target.value }))}
                      placeholder="E.g. 1009"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Salary & Bank details */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1">3. Compensation & EPF Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Contract Type</label>
                    <select
                      value={formEmp.salaryType || "Monthly"}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, salaryType: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Daily">Daily</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Salary (LKR)</label>
                    <input
                      type="number"
                      required
                      value={formEmp.basicSalary || 0}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                      placeholder="Basic salary amount"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EPF Number</label>
                    <input
                      type="text"
                      value={formEmp.epfNumber || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, epfNumber: e.target.value }))}
                      placeholder="E.g. 9876543"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETF Number</label>
                    <input
                      type="text"
                      value={(formEmp as any).etfNumber || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, etfNumber: e.target.value }))}
                      placeholder="E.g. 9876543-A"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</label>
                    <input
                      type="text"
                      value={(formEmp as any).bankName || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="E.g. Commercial Bank"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Account</label>
                    <input
                      type="text"
                      value={(formEmp as any).bankAccount || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, bankAccount: e.target.value }))}
                      placeholder="E.g. 10100020202"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Contact details */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1">4. Contact & Address Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formEmp.email || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="employee@kawdoco.com"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={formEmp.phone || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="E.g. 077 123 4567"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                    <input
                      type="text"
                      required
                      value={formEmp.address || ""}
                      onChange={(e) => setFormEmp(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street, City, Country"
                      className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mt-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact Person</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400">Contact Name</label>
                      <input
                        type="text"
                        value={formEmp.emergencyContact?.name || ""}
                        onChange={(e) => setFormEmp(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact!,
                            name: e.target.value
                          }
                        }))}
                        className="w-full border border-slate-200 bg-white rounded-md text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400">Relationship</label>
                      <input
                        type="text"
                        value={formEmp.emergencyContact?.relationship || ""}
                        onChange={(e) => setFormEmp(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact!,
                            relationship: e.target.value
                          }
                        }))}
                        className="w-full border border-slate-200 bg-white rounded-md text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400">Contact Phone</label>
                      <input
                        type="text"
                        value={formEmp.emergencyContact?.phone || ""}
                        onChange={(e) => setFormEmp(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact!,
                            phone: e.target.value
                          }
                        }))}
                        className="w-full border border-slate-200 bg-white rounded-md text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 -mx-6 -mb-6 rounded-b-2xl mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10"
                >
                  {modalMode === "add" ? "Save Employee" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
