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
  Calendar,
  AlertTriangle,
  Upload,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { mockEmployees, Employee } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

interface ParsedImportRecord {
  tempId: string;
  rowNumber: number;
  data: Partial<Employee>;
  validationErrors: string[];
}

export default function EmployeesPage() {
  const { user, role, employeeId } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
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

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ParsedImportRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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

  // CSV Seeding / Template Download
  const handleDownloadSampleCSV = () => {
    const csvContent = 
      "id,name,nic,dob,gender,maritalStatus,nationality,joinedDate,department,designation,type,status,biostarId,salaryType,basicSalary,epfNumber,etfNumber,bankName,bankAccount,email,phone,address,emergencyName,emergencyRelationship,emergencyPhone\n" +
      "EMP100,John Doe,199012345678,1990-01-01,Male,Single,Sri Lankan,2026-06-01,IT Department,Senior Engineer,Permanent,Active,1009,Monthly,200000,EPF-100,ETF-100,Commercial Bank,1234567890,john@kawdoco.com,0771234567,\"123, Main Street, Colombo 04\",Jane Doe,Spouse,0779876543\n" +
      "EMP101,Jane Smith,199298765432,1992-05-10,Female,Married,Sri Lankan,2026-06-01,HR Department,HR Specialist,Contract,Active,1010,Monthly,140000,EPF-101,ETF-101,HNB,9876543210,jane@kawdoco.com,0711112222,\"45, Galle Road, Wattala\",Jack Smith,Spouse,0722223333\n";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "payrollex_employee_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parsing lightweight logic
  const parseCSVContent = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const results: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let insideQuote = false;
      let currentValue = "";

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/^"|"$/g, "") || "";
      });
      results.push(row);
    }
    return results;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportError("File content is empty");
        return;
      }

      try {
        const parsedRows = parseCSVContent(text);
        if (parsedRows.length === 0) {
          setImportError("No data rows found in CSV file.");
          return;
        }

        const validatedRecords: ParsedImportRecord[] = parsedRows.map((row, idx) => {
          const rowNumber = idx + 2; // header is row 1
          const validationErrors: string[] = [];
          
          const name = row.name || "";
          const designation = row.designation || "";
          const department = row.department || "IT Department";
          const nic = row.nic || "";
          const email = row.email || "";
          const phone = row.phone || "";
          const address = row.address || "";
          const type = (row.type === "Contract" || row.type === "Probation") ? row.type : "Permanent";
          const status = (row.status === "Inactive" || row.status === "Terminated") ? row.status : "Active";
          const gender = (row.gender === "Female" || row.gender === "Other") ? row.gender : "Male";
          const maritalStatus = row.maritalStatus || "Single";
          const nationality = row.nationality || "Sri Lankan";
          const dob = row.dob || "";
          const joinedDate = row.joinedDate || new Date().toISOString().split("T")[0];
          const biostarId = row.biostarId || "";
          const salaryType = row.salaryType || "Monthly";
          const basicSalary = parseFloat(row.basicSalary) || 0;
          const epfNumber = row.epfNumber || "";
          
          const emergencyName = row.emergencyName || "";
          const emergencyRelationship = row.emergencyRelationship || "";
          const emergencyPhone = row.emergencyPhone || "";

          // Required validations
          if (!name) validationErrors.push("Name is required");
          if (!designation) validationErrors.push("Designation is required");
          if (!nic) validationErrors.push("NIC/Passport is required");
          if (email && !/\S+@\S+\.\S+/.test(email)) validationErrors.push("Invalid email format");
          
          // ID check
          let targetId = row.id || "";
          if (targetId) {
            if (employees.some(emp => emp.id === targetId)) {
              validationErrors.push(`Employee ID ${targetId} already exists in system`);
            }
          }

          const employeeData: Partial<Employee> = {
            id: targetId,
            name,
            photo: name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "US",
            department,
            designation,
            type: type as any,
            status: status as any,
            biostarId,
            nic,
            dob,
            gender,
            maritalStatus,
            nationality,
            joinedDate,
            salaryType,
            basicSalary,
            epfNumber,
            address,
            email,
            phone,
            emergencyContact: {
              name: emergencyName,
              relationship: emergencyRelationship,
              phone: emergencyPhone
            },
            // Custom extended fields
            etfNumber: row.etfNumber || "",
            bankName: row.bankName || "Commercial Bank",
            bankAccount: row.bankAccount || ""
          } as any;

          return {
            tempId: `temp-${idx}-${Date.now()}`,
            rowNumber,
            data: employeeData,
            validationErrors
          };
        });

        // Determine next ID starting sequence
        let currentMaxIdNum = 0;
        if (employees.length > 0) {
          const numericIds = employees
            .map(emp => {
              const match = emp.id.match(/\d+/);
              return match ? parseInt(match[0]) : 0;
            })
            .filter(n => n > 0);
          if (numericIds.length > 0) {
            currentMaxIdNum = Math.max(...numericIds);
          }
        }

        // Fill in missing auto IDs sequentially
        let tempNextIdNum = currentMaxIdNum + 1;
        const finalRecords = validatedRecords.map(record => {
          if (!record.data.id) {
            const nextId = `EMP${String(tempNextIdNum).padStart(3, "0")}`;
            tempNextIdNum++;
            record.data.id = nextId;
          }
          return record;
        });

        setImportPreviewData(finalRecords);
      } catch (err) {
        setImportError("Failed to parse CSV file: " + (err as Error).message);
      }
    };
    reader.onerror = () => {
      setImportError("Error reading file.");
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (importPreviewData.length === 0) return;
    
    // Check if any row has validation errors
    const validRows = importPreviewData.filter(r => r.validationErrors.length === 0);
    const invalidRowsCount = importPreviewData.length - validRows.length;

    if (invalidRowsCount > 0) {
      if (!confirm(`Warning: ${invalidRowsCount} row(s) contain validation errors and will be SKIPPED. Proceed with importing the remaining ${validRows.length} valid employee record(s)?`)) {
        return;
      }
    }

    if (validRows.length === 0) {
      alert("No valid employee records to import.");
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      // Save rows sequentially
      for (const row of validRows) {
        const id = row.data.id!;
        const payload = { ...row.data };
        // Delete id field from the payload body to avoid redundancy
        delete payload.id;
        
        await setDoc(doc(db, "employees", id), payload);
      }

      alert(`Successfully registered ${validRows.length} employee profiles!`);
      setShowImportModal(false);
      setImportPreviewData([]);
    } catch (err) {
      console.error("Bulk write failed:", err);
      setImportError("Failed to write data: " + (err as Error).message);
    } finally {
      setImporting(false);
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
                    onClick={() => setShowImportModal(true)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Import
                  </button>
                )}
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

      {/* Bulk CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Bulk Employee Registration (CSV Import)
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreviewData([]);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {importPreviewData.length === 0 ? (
                /* VIEW 1: UPLOAD & INSTRUCTIONS */
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Instructions Menu Column */}
                  <div className="lg:col-span-2 space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                        Import Instructions
                      </h4>
                      <ul className="list-decimal pl-4 space-y-1.5 text-slate-600 font-medium leading-relaxed">
                        <li>Prepare a CSV spreadsheet containing your employee list.</li>
                        <li>The CSV first line must be the exact header titles list.</li>
                        <li>
                          <strong>Required Columns</strong>: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[9px]">name</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[9px]">designation</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[9px]">nic</code>.
                        </li>
                        <li>
                          <strong>Optional ID Mapping</strong>: If the <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[9px]">id</code> column is left blank, the system will auto-generate sequential IDs (e.g. starting at <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[9px]">EMP009</code>).
                        </li>
                        <li>Verify dates are formatted as <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[9px]">YYYY-MM-DD</code>.</li>
                        <li>Address values containing commas must be enclosed in double quotes.</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center text-center space-y-2.5">
                      <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                      <div>
                        <h5 className="font-bold text-blue-900">Sample CSV Template</h5>
                        <p className="text-[10px] text-blue-700 mt-0.5 leading-normal max-w-[200px]">
                          Download our ready-made CSV template with correct headers and test rows.
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadSampleCSV}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] transition-colors flex items-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Template
                      </button>
                    </div>
                  </div>

                  {/* Drag and Drop Box */}
                  <div className="lg:col-span-3 flex flex-col justify-center">
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all min-h-[16rem]">
                      <div className="p-4 bg-white rounded-full border border-slate-100 shadow-sm text-slate-400 group-hover:text-blue-500">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Select Employee CSV File</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Drag & drop a file here or click to browse local files (.csv)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </label>
                    {importError && (
                      <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                        {importError}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* VIEW 2: PARSED PREVIEW TABLE */
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">File Parsed Successfully</span>
                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                          Found {importPreviewData.length} records. Please review validations.
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setImportPreviewData([])}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Upload Another File
                    </button>
                  </div>

                  {importError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                      {importError}
                    </div>
                  )}

                  {/* Scrollable Preview Table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-inner max-h-[45vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3.5 text-center">Row</th>
                          <th className="py-2.5 px-3.5">ID</th>
                          <th className="py-2.5 px-3.5">Full Name</th>
                          <th className="py-2.5 px-3.5">Department</th>
                          <th className="py-2.5 px-3.5">Designation</th>
                          <th className="py-2.5 px-3.5">Basic Salary</th>
                          <th className="py-2.5 px-3.5">Email</th>
                          <th className="py-2.5 px-3.5">Validation Warnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importPreviewData.map((record) => (
                          <tr key={record.tempId} className={record.validationErrors.length > 0 ? "bg-red-50/30" : "hover:bg-slate-50/50"}>
                            <td className="py-2.5 px-3.5 text-center font-bold text-slate-400">{record.rowNumber}</td>
                            <td className="py-2.5 px-3.5 font-bold text-blue-600">{record.data.id}</td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-700">{record.data.name || <span className="text-red-500 italic">Missing</span>}</td>
                            <td className="py-2.5 px-3.5 text-slate-500 font-semibold">{record.data.department}</td>
                            <td className="py-2.5 px-3.5 text-slate-500 font-semibold">{record.data.designation || <span className="text-red-500 italic">Missing</span>}</td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-600 font-bold">LKR {record.data.basicSalary ? record.data.basicSalary.toLocaleString() : "0.00"}</td>
                            <td className="py-2.5 px-3.5 text-slate-500 font-medium">{record.data.email || <span className="text-slate-300 italic">N/A</span>}</td>
                            <td className="py-2.5 px-3.5">
                              {record.validationErrors.length > 0 ? (
                                <div className="space-y-0.5">
                                  {record.validationErrors.map((err, errIdx) => (
                                    <span key={errIdx} className="inline-flex items-center gap-0.5 bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                      {err}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  Valid Row
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-2xl shrink-0 text-xs">
              <span className="text-slate-400 font-semibold">
                {importPreviewData.length > 0 && (
                  <>
                    Valid Records:{" "}
                    <span className="text-emerald-600 font-bold">
                      {importPreviewData.filter(r => r.validationErrors.length === 0).length}
                    </span>{" "}
                    / {importPreviewData.length}
                  </>
                )}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreviewData([]);
                    setImportError(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-white transition-colors"
                >
                  Cancel
                </button>
                {importPreviewData.length > 0 && (
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                  >
                    {importing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Records...
                      </>
                    ) : (
                      <>
                        Save Valid Employee Profiles
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
