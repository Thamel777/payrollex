"use client";

import { useState, useMemo } from "react";
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
  AlertCircle
} from "lucide-react";
import { mockEmployees, Employee } from "@/lib/mockData";

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(mockEmployees[0]);
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);

  // Modal / Add Employee Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
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
    emergencyContact: { name: "", relationship: "", phone: "" },
    address: ""
  });

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
        emp.biostarId.includes(searchTerm);
      const matchesDept = deptFilter === "All" || emp.department === deptFilter;
      const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, deptFilter, statusFilter]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.designation) {
      alert("Please fill out name and designation");
      return;
    }
    const id = `EMP00${employees.length + 1}`;
    const freshEmployee: Employee = {
      ...(newEmp as Employee),
      id,
      photo: newEmp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    };
    setEmployees(prev => [...prev, freshEmployee]);
    setSelectedEmp(freshEmployee);
    setShowAddModal(false);
    // Reset form
    setNewEmp({
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
      emergencyContact: { name: "", relationship: "", phone: "" },
      address: ""
    });
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm(`Are you sure you want to delete employee ${id}?`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      if (selectedEmp?.id === id) {
        setSelectedEmp(null);
      }
    }
  };

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
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Employee
                </button>
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
                            <button
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                              title="Edit Details"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
                      <span className="text-slate-400 font-semibold">Basic Salary</span>
                      <span className="font-bold text-slate-700">LKR {selectedEmp.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">BioStar 2 User ID</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1">
                        <Fingerprint className="h-4 w-4 shrink-0" />
                        {selectedEmp.biostarId}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "bank" && (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">EPF Number</span>
                      <span className="font-bold text-slate-700">{selectedEmp.epfNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Bank Name</span>
                      <span className="font-bold text-slate-700">Commercial Bank</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Account Number</span>
                      <span className="font-bold text-slate-700">1234 5678 9012</span>
                    </div>
                  </div>
                )}

                {activeTab === "contact" && (
                  <div className="space-y-3.5 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Name</span>
                        <span className="font-bold text-slate-700">{selectedEmp.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Relationship</span>
                        <span className="font-bold text-slate-700">{selectedEmp.emergencyContact.relationship}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Contact Number</span>
                        <span className="font-bold text-blue-600">{selectedEmp.emergencyContact.phone}</span>
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
                <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10 cursor-pointer">
                  Edit Profile
                </button>
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-blue-600" />
                Add New Employee Profile
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.name}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g. Nimal Perera"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, department: e.target.value }))}
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
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="E.g. Senior Software Engineer"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIC / Passport</label>
                  <input
                    type="text"
                    required
                    value={newEmp.nic}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, nic: e.target.value }))}
                    placeholder="E.g. 199123456789"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newEmp.dob}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    value={newEmp.gender}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BioStar ID</label>
                  <input
                    type="text"
                    value={newEmp.biostarId}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, biostarId: e.target.value }))}
                    placeholder="E.g. 1009"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Salary (LKR)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.basicSalary}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                    placeholder="Basic salary amount"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EPF Number</label>
                  <input
                    type="text"
                    value={newEmp.epfNumber}
                    onChange={(e) => setNewEmp(prev => ({ ...prev, epfNumber: e.target.value }))}
                    placeholder="E.g. 9876543"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 -mx-6 -mb-6 rounded-b-2xl mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
