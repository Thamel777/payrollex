"use client";

import { useState, useMemo, useEffect } from "react";
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
  Edit2,
  Trash2
} from "lucide-react";
import { mockEmployees, mockShifts, Shift, Employee } from "@/lib/mockData";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import Portal from "@/components/Portal";

export default function ShiftRosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [deptFilter, shiftFilter]);
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

  // Active cell edit state for popover
  const [activeCell, setActiveCell] = useState<{
    empId: string;
    date: string;
    currentShift: string;
    position: { top: number; left: number };
    positionType: 'absolute' | 'fixed';
  } | null>(null);

  // Auth Context
  const { user, role, employeeId } = useAuth();

  // Shift templates modal state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    name: "",
    time: "",
    grace: "15m | Break: 1h",
    break: "1 Hour",
    status: "Active" as "Active" | "Inactive",
    color: "bg-green-100 text-green-800 border-green-200"
  });

  // Bulk Allocation Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    department: "All",
    shiftName: "",
    dateOption: "week", // week, range, single
    singleDate: "2024-05-20",
    fromDate: "2024-05-20",
    toDate: "2024-05-26"
  });
  const [isAllocating, setIsAllocating] = useState(false);

  // Custom Snappy Confirm Popup Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void | Promise<void>;
    type: "warning" | "info" | "danger" | "success";
    position?: { top: number; left: number };
  }>({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: () => {},
    type: "info"
  });

  // Calculate manager department if user is a Department Manager
  const managerDept = useMemo(() => {
    if (role === "Department Manager" && employees.length > 0) {
      const mgr = employees.find(
        e => e.id === employeeId || (user?.email && e.email && e.email.toLowerCase() === user.email.toLowerCase())
      );
      return mgr?.department || "";
    }
    return "";
  }, [role, employees, employeeId, user]);

  // Set default department filter for department managers
  useEffect(() => {
    if (role === "Department Manager" && managerDept) {
      setDeptFilter(managerDept);
    }
  }, [role, managerDept]);

  // Custom snappy helper for confirmations
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    type: "warning" | "info" | "danger" | "success" = "info",
    confirmText: string = "Confirm",
    cancelText: string = "Cancel",
    event?: any
  ) => {
    let position: { top: number; left: number } | undefined = undefined;
    if (event && event.currentTarget) {
      try {
        let targetElement = event.currentTarget;
        if (targetElement.tagName === "FORM") {
          const submitBtn = targetElement.querySelector('button[type="submit"]') || targetElement.querySelector('button');
          if (submitBtn) {
            targetElement = submitBtn;
          }
        }
        const rect = targetElement.getBoundingClientRect();
        const buttonWidth = rect.width;
        const modalWidth = 320;
        
        let left = rect.left + buttonWidth / 2 - modalWidth / 2;
        let top = rect.bottom + 8;
        
        if (left < 16) left = 16;
        if (left + modalWidth > window.innerWidth - 16) {
          left = window.innerWidth - modalWidth - 16;
        }
        
        const modalHeight = 180;
        if (top + modalHeight > window.innerHeight - 16) {
          top = rect.top - modalHeight - 8;
        }
        if (top < 16) top = rect.bottom + 8;
        
        position = { top, left };
      } catch (err) {
        console.error("Failed to calculate popup position:", err);
      }
    }

    setConfirmModal({
      show: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type,
      position
    });
  };

  const showAlert = (
    title: string,
    message: string,
    type: "warning" | "info" | "danger" | "success" = "info",
    event?: any
  ) => {
    let position = undefined;
    if (event && event.currentTarget) {
      try {
        let targetElement = event.currentTarget;
        const rect = targetElement.getBoundingClientRect();
        const buttonWidth = rect.width;
        const modalWidth = 320;
        
        let left = rect.left + buttonWidth / 2 - modalWidth / 2;
        let top = rect.bottom + 8;
        
        if (left < 16) left = 16;
        if (left + modalWidth > window.innerWidth - 16) {
          left = window.innerWidth - modalWidth - 16;
        }
        
        const modalHeight = 150;
        if (top + modalHeight > window.innerHeight - 16) {
          top = rect.top - modalHeight - 8;
        }
        if (top < 16) top = rect.bottom + 8;
        
        position = { top, left };
      } catch {
        // Fallback
      }
    }
    setConfirmModal({
      show: true,
      title,
      message,
      confirmText: "OK",
      cancelText: "",
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type,
      position
    });
  };

  // Load shifts templates and rules, and employees
  useEffect(() => {
    const unsubShifts = onSnapshot(collection(db, "shifts"), (snapshot) => {
      if (snapshot.empty) {
        // Seed default shifts
        mockShifts.forEach(async (s) => {
          await setDoc(doc(db, "shifts", s.id), s);
        });
      } else {
        const list: Shift[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Shift);
        });
        setShifts(list);
      }
    });

    const unsubEmp = onSnapshot(collection(db, "employees"), (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setEmployees(list);
      setDbLoading(false);
    });

    const fetchRules = async () => {
      try {
        const docRef = doc(db, "settings", "shift_rules");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRules(docSnap.data() as any);
        } else {
          await setDoc(docRef, {
            gracePeriod: 15,
            lateAfter: "Grace Period",
            earlyBefore: 15,
            defaultBreak: 60,
            minWorkHours: 8,
            otAfter: 8
          });
        }
      } catch (err) {
        console.error("Failed to load shift rules:", err);
      }
    };

    fetchRules();

    return () => {
      unsubShifts();
      unsubEmp();
    };
  }, []);

  // Extract unique departments from Firestore employees (falling back to mock if db loading)
  const departments = useMemo(() => {
    const sourceList = employees.length > 0 ? employees : mockEmployees;
    return ["All", ...Array.from(new Set(sourceList.map(emp => emp.department)))];
  }, [employees]);

  // Week dates mapping
  const weekDates = ["2024-05-20", "2024-05-21", "2024-05-22", "2024-05-23", "2024-05-24", "2024-05-25", "2024-05-26"];

  const getEmployeeShiftForDate = (emp: any, date: string) => {
    if (emp.roster && emp.roster[date]) {
      return emp.roster[date];
    }
    // Fallbacks to match original mock data
    const dayOfWeek = new Date(date).getDay(); // 0 is Sunday, 1 is Monday, etc.
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "Weekend Off";
    }
    if (emp.department === "Finance Department") {
      return "Night Shift";
    }
    if (emp.department === "Operations Department" && dayOfWeek === 4) { // Thursday
      return "Holiday Shift";
    }
    if (emp.department === "HR Department" && (dayOfWeek === 3 || dayOfWeek === 4)) { // Wed/Thu
      return "Flexible Shift";
    }
    if (emp.department === "Marketing Department") {
      return "Rotating Shift";
    }
    return "General Shift";
  };

  // Filter roster rows
  const rosterData = useMemo(() => {
    const sourceEmployees = employees.length > 0 ? employees : mockEmployees;
    
    const schedules = sourceEmployees.map(emp => {
      const mon = getEmployeeShiftForDate(emp, "2024-05-20");
      const tue = getEmployeeShiftForDate(emp, "2024-05-21");
      const wed = getEmployeeShiftForDate(emp, "2024-05-22");
      const thu = getEmployeeShiftForDate(emp, "2024-05-23");
      const fri = getEmployeeShiftForDate(emp, "2024-05-24");
      const sat = getEmployeeShiftForDate(emp, "2024-05-25");
      const sun = getEmployeeShiftForDate(emp, "2024-05-26");
      return {
        id: emp.id,
        name: emp.name,
        dept: emp.department,
        mon,
        tue,
        wed,
        thu,
        fri,
        sat,
        sun
      };
    });

    return schedules.filter(row => {
      const matchesDept = deptFilter === "All" || row.dept === deptFilter;
      const matchesShift = shiftFilter === "All" ||
        row.mon === shiftFilter ||
        row.tue === shiftFilter ||
        row.wed === shiftFilter ||
        row.thu === shiftFilter ||
        row.fri === shiftFilter;
      return matchesDept && matchesShift;
    });
  }, [employees, deptFilter, shiftFilter]);

  const paginatedRoster = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return rosterData.slice(startIndex, startIndex + itemsPerPage);
  }, [rosterData, currentPage]);

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

  const handleCellClick = (empId: string, date: string, currentShift: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 180;
    const popupHeight = 240;
    
    let left = rect.left + rect.width / 2 - popupWidth / 2;
    let top = rect.bottom + 8;
    
    const pageRoot = document.getElementById("shifts-page-root");
    let positionType: 'absolute' | 'fixed' = 'fixed';
    if (pageRoot) {
      const pageRect = pageRoot.getBoundingClientRect();
      left = rect.left - pageRect.left + rect.width / 2 - popupWidth / 2;
      top = rect.bottom - pageRect.top + 8;
      positionType = 'absolute';
      
      if (left < 16) left = 16;
      if (left + popupWidth > pageRect.width - 16) {
        left = pageRect.width - popupWidth - 16;
      }
    } else {
      if (left < 16) left = 16;
      if (left + popupWidth > window.innerWidth - 16) {
        left = window.innerWidth - popupWidth - 16;
      }
      if (top + popupHeight > window.innerHeight - 16) {
        top = rect.top - popupHeight - 8;
      }
    }
    
    setActiveCell({
      empId,
      date,
      currentShift,
      position: { top, left },
      positionType
    });
  };

  const handleUpdateShift = async (empId: string, date: string, shiftName: string) => {
    try {
      await updateDoc(doc(db, "employees", empId), {
        [`roster.${date}`]: shiftName
      });
      setActiveCell(null);
    } catch (err) {
      console.error("Failed to update shift:", err);
    }
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "Admin" && role !== "HR Manager") {
      showAlert("Access Denied", "You do not have permission to modify shift templates.", "danger", e);
      return;
    }
    if (!shiftForm.name || !shiftForm.time) {
      showAlert("Missing Fields", "Please provide both shift name and timings.", "warning", e);
      return;
    }
    try {
      const id = editingShift ? editingShift.id : "S" + Math.floor(1000 + Math.random() * 9000);
      const newShift: Shift = {
        id,
        name: shiftForm.name,
        time: shiftForm.time,
        grace: shiftForm.grace || "15m | Break: 1h",
        break: shiftForm.break || "1 Hour",
        status: shiftForm.status,
        color: shiftForm.color
      };
      await setDoc(doc(db, "shifts", id), newShift);
      setShowShiftModal(false);
      setEditingShift(null);
      showAlert("Success", `Shift "${shiftForm.name}" saved successfully.`, "success", e);
    } catch (err) {
      console.error("Failed to save shift:", err);
      showAlert("Error", "Failed to save shift template.", "danger", e);
    }
  };

  const handleDeleteShift = async (shift: Shift, event: any) => {
    if (role !== "Admin" && role !== "HR Manager") {
      showAlert("Access Denied", "You do not have permission to delete shift templates.", "danger", event);
      return;
    }
    showConfirm(
      "Delete Shift",
      `Are you sure you want to delete shift "${shift.name}"? This template will no longer be available for allocation.`,
      async () => {
        try {
          await deleteDoc(doc(db, "shifts", shift.id));
          showAlert("Deleted", `Shift "${shift.name}" has been deleted.`, "success", event);
        } catch (err) {
          console.error("Failed to delete shift:", err);
          showAlert("Error", "Failed to delete shift.", "danger", event);
        }
      },
      "danger",
      "Delete",
      "Cancel",
      event
    );
  };

  const handleBulkAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateForm.shiftName) {
      showAlert("Missing Field", "Please select a shift to allocate.", "warning", e);
      return;
    }

    const targetDept = role === "Department Manager" ? managerDept : allocateForm.department;
    if (!targetDept || targetDept === "All") {
      showAlert("Missing Field", "Please select a specific department.", "warning", e);
      return;
    }

    setIsAllocating(true);
    try {
      // Get all employees matching department
      const matchingEmployees = employees.filter(emp => emp.department === targetDept);
      if (matchingEmployees.length === 0) {
        showAlert("No Employees", `No employees found in the ${targetDept}.`, "info", e);
        setIsAllocating(false);
        return;
      }

      // Determine date list
      let datesToUpdate: string[] = [];
      if (allocateForm.dateOption === "week") {
        datesToUpdate = ["2024-05-20", "2024-05-21", "2024-05-22", "2024-05-23", "2024-05-24", "2024-05-25", "2024-05-26"];
      } else if (allocateForm.dateOption === "single") {
        datesToUpdate = [allocateForm.singleDate];
      } else {
        // Date range
        const start = new Date(allocateForm.fromDate);
        const end = new Date(allocateForm.toDate);
        let curr = new Date(start);
        while (curr <= end) {
          datesToUpdate.push(curr.toISOString().split("T")[0]);
          curr.setDate(curr.getDate() + 1);
        }
      }

      // Perform updates
      for (const emp of matchingEmployees) {
        const updatePayload: Record<string, string> = {};
        datesToUpdate.forEach(date => {
          updatePayload[`roster.${date}`] = allocateForm.shiftName;
        });
        await updateDoc(doc(db, "employees", emp.id), updatePayload);
      }

      setShowAllocateModal(false);
      showAlert(
        "Allocation Complete",
        `Successfully allocated "${allocateForm.shiftName}" to ${matchingEmployees.length} employees in ${targetDept} for ${datesToUpdate.length} day(s).`,
        "success",
        e
      );
    } catch (err) {
      console.error("Bulk allocation failed:", err);
      showAlert("Error", "Failed to allocate shifts.", "danger", e);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "Admin" && role !== "HR Manager") {
      showAlert("Access Denied", "You do not have permission to modify shift rules.", "danger", e);
      return;
    }
    try {
      await setDoc(doc(db, "settings", "shift_rules"), rules);
      setShowRulesModal(false);
      showAlert("Success", "Shift rules updated successfully.", "success", e);
    } catch (err) {
      console.error("Failed to save rules:", err);
      showAlert("Error", "Failed to save rules.", "danger", e);
    }
  };

  return (
    <div className="space-y-6 select-none relative" id="shifts-page-root">
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
            <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
              {/* Row 1: Navigation and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Date Selector & Today Button */}
                <div className="flex items-center gap-3">
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
                </div>

                {/* Right: View toggle and Export button */}
                <div className="flex items-center gap-2.5">
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
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer bg-white">
                    <Download className="h-4 w-4" /> Export
                  </button>
                </div>
              </div>

              {/* Row 2: Filter Selectors */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filters:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {departments.filter(d => d !== "All").map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white cursor-pointer"
                >
                  <option value="All">All Shifts</option>
                  {(shifts.length > 0 ? shifts : mockShifts).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
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
                  {paginatedRoster.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{row.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{row.dept.split(" ")[0]} Dept</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-20", row.mon, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.mon)}`}
                        >
                          {row.mon}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-21", row.tue, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.tue)}`}
                        >
                          {row.tue}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-22", row.wed, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.wed)}`}
                        >
                          {row.wed}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-23", row.thu, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.thu)}`}
                        >
                          {row.thu}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-24", row.fri, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.fri)}`}
                        >
                          {row.fri}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center bg-slate-50/20">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-25", row.sat, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.sat)}`}
                        >
                          {row.sat}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center bg-slate-50/20">
                        <span 
                          onClick={(e) => handleCellClick(row.id, "2024-05-26", row.sun, e)}
                          className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getShiftBadgeStyle(row.sun)}`}
                        >
                          {row.sun}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 font-semibold bg-slate-50/50 border-b border-slate-100">
            <span>
              Showing {rosterData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, rosterData.length)} of {rosterData.length} employees
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600 font-bold"
              >
                Prev
              </button>
              <button className="px-2.5 py-1 bg-blue-600 text-white rounded-md font-bold">{currentPage}</button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * itemsPerPage >= rosterData.length}
                className="px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-600 font-bold"
              >
                Next
              </button>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
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
              {(role === "Admin" || role === "HR Manager") && (
                <button
                  onClick={() => {
                    setEditingShift(null);
                    setShiftForm({
                      name: "",
                      time: "",
                      grace: "15m | Break: 1h",
                      break: "1 Hour",
                      status: "Active",
                      color: "bg-green-100 text-green-800 border-green-200"
                    });
                    setShowShiftModal(true);
                  }}
                  className="p-1 hover:bg-slate-50 rounded-md text-blue-600 cursor-pointer"
                  title="Add Shift"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-[19.5rem] overflow-y-auto pr-1">
              {(shifts.length > 0 ? shifts : mockShifts).map((shift) => (
                <div key={shift.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex flex-col gap-1.5 group relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">{shift.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        shift.status === "Active" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {shift.status}
                      </span>
                      {(role === "Admin" || role === "HR Manager") && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5">
                          <button
                            onClick={() => {
                              setEditingShift(shift);
                              setShiftForm({
                                name: shift.name,
                                time: shift.time,
                                grace: shift.grace,
                                break: shift.break,
                                status: shift.status as "Active" | "Inactive",
                                color: shift.color
                              });
                              setShowShiftModal(true);
                            }}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Shift"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteShift(shift, e)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Shift"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
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
                  {departments.filter(dept => dept !== "All").map((dept) => {
                    const empCount = employees.filter(e => e.department === dept).length;
                    const isMgrForThisDept = role === "Department Manager" && managerDept === dept;
                    const canAllocate = role === "Admin" || role === "HR Manager" || isMgrForThisDept;
                    
                    // Extract unique assigned shifts for this department from dynamic employee roster maps
                    const assignedShifts = Array.from(new Set(
                      employees
                        .filter(e => e.department === dept && e.roster)
                        .flatMap(e => Object.values(e.roster || {}))
                    )).filter(Boolean).join(", ") || "General Shift, Weekend Off";

                    return (
                      <tr key={dept} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-bold text-slate-700">{dept}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{assignedShifts}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{empCount}</td>
                        <td className="py-3 px-4 text-center">
                          {canAllocate ? (
                            <button
                              onClick={() => {
                                setAllocateForm({
                                  department: dept,
                                  shiftName: "",
                                  dateOption: "week",
                                  singleDate: "2024-05-20",
                                  fromDate: "2024-05-20",
                                  toDate: "2024-05-26"
                                });
                                setShowAllocateModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title={`Allocate Shifts to ${dept}`}
                            >
                              <Edit2 className="h-3.5 w-3.5 mx-auto" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
        <Portal>
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
        </Portal>
      )}

      {/* Add/Edit Shift Modal */}
      {showShiftModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-blue-600" />
                {editingShift ? "Edit Shift Template" : "Add Shift Template"}
              </h3>
            </div>
            <form onSubmit={handleSaveShift} className="p-6 space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Name</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Night Shift"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timings</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.time}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="e.g. 06:00 PM - 03:00 AM"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grace & Break Info</label>
                  <input
                    type="text"
                    value={shiftForm.grace}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, grace: e.target.value }))}
                    placeholder="e.g. 15m | Break: 1h"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Break Duration</label>
                  <input
                    type="text"
                    value={shiftForm.break}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, break: e.target.value }))}
                    placeholder="e.g. 1 Hour"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={shiftForm.status}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, status: e.target.value as "Active" | "Inactive" }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color Theme</label>
                  <select
                    value={shiftForm.color}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold bg-white"
                  >
                    <option value="bg-green-100 text-green-800 border-green-200">Green Badge (General)</option>
                    <option value="bg-purple-100 text-purple-800 border-purple-200">Purple Badge (Night)</option>
                    <option value="bg-blue-100 text-blue-800 border-blue-200">Blue Badge (Flexible)</option>
                    <option value="bg-orange-100 text-orange-800 border-orange-200">Orange Badge (Rotating)</option>
                    <option value="bg-indigo-100 text-indigo-800 border-indigo-200">Indigo Badge (Weekend)</option>
                    <option value="bg-red-100 text-red-800 border-red-200">Red Badge (Holiday)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10"
                >
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Bulk Shift Allocation Modal */}
      {showAllocateModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Building className="h-4.5 w-4.5 text-blue-600" />
                Department Shift Allocation
              </h3>
            </div>
            <form onSubmit={handleBulkAllocate} className="p-6 space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Department</label>
                  <input
                    type="text"
                    disabled
                    value={allocateForm.department}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-500 bg-slate-50 font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Shift to Assign</label>
                  <select
                    required
                    value={allocateForm.shiftName}
                    onChange={(e) => setAllocateForm(prev => ({ ...prev, shiftName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold bg-white"
                  >
                    <option value="">-- Choose Shift --</option>
                    {(shifts.length > 0 ? shifts : mockShifts).map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="Weekend Off">Weekend Off</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Configuration</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="dateOption"
                        value="week"
                        checked={allocateForm.dateOption === "week"}
                        onChange={() => setAllocateForm(prev => ({ ...prev, dateOption: "week" }))}
                      />
                      Active Week
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="dateOption"
                        value="single"
                        checked={allocateForm.dateOption === "single"}
                        onChange={() => setAllocateForm(prev => ({ ...prev, dateOption: "single" }))}
                      />
                      Single Date
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="dateOption"
                        value="range"
                        checked={allocateForm.dateOption === "range"}
                        onChange={() => setAllocateForm(prev => ({ ...prev, dateOption: "range" }))}
                      />
                      Custom Range
                    </label>
                  </div>
                </div>

                {allocateForm.dateOption === "single" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Date</label>
                    <input
                      type="date"
                      required
                      value={allocateForm.singleDate}
                      onChange={(e) => setAllocateForm(prev => ({ ...prev, singleDate: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    />
                  </div>
                )}

                {allocateForm.dateOption === "range" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                      <input
                        type="date"
                        required
                        value={allocateForm.fromDate}
                        onChange={(e) => setAllocateForm(prev => ({ ...prev, fromDate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                      <input
                        type="date"
                        required
                        value={allocateForm.toDate}
                        onChange={(e) => setAllocateForm(prev => ({ ...prev, toDate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={isAllocating}
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isAllocating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10 flex items-center gap-1.5"
                >
                  {isAllocating && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Custom Snappy Confirmation Popup Modal Overlay */}
      {confirmModal.show && (
        <Portal>
          <div 
            className="fixed inset-0 z-[1000] bg-black/15 backdrop-blur-[1px] select-none p-4 flex items-center justify-center animate-fade-in-fast"
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-[320px] z-[1001] animate-pop-in text-xs font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${
                confirmModal.type === "danger" 
                  ? "bg-rose-50 text-rose-600" 
                  : confirmModal.type === "warning"
                  ? "bg-amber-50 text-amber-600"
                  : confirmModal.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-blue-50 text-blue-600"
              }`}>
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1 pr-2">
                <span className="font-bold text-slate-800 text-sm block">
                  {confirmModal.title}
                </span>
                <p className="text-[10px] text-slate-400 font-medium leading-normal">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              {confirmModal.cancelText && (
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                onClick={confirmModal.onConfirm}
                className={`px-3.5 py-1.5 text-white font-bold rounded-lg text-[10px] shadow-sm cursor-pointer ${
                  confirmModal.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                    : confirmModal.type === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/10"
                    : confirmModal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Active Cell Shift Selection Popover (positioned context-sensitively next to action button/cell) */}
      {activeCell && (
        <Portal>
          {/* Overlay to catch clicks and close */}
          <div 
            className="fixed inset-0 z-[100] bg-transparent"
            onClick={() => setActiveCell(null)}
          />
          {/* Popover content rendered at root, absolute/fixed to shifts-page-root */}
          <div 
            className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 w-[180px] z-[101] animate-pop-in"
            style={{
              position: activeCell.positionType,
              top: activeCell.position.top,
              left: activeCell.position.left
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1.5 uppercase tracking-wider border-b border-slate-100">
              Select Shift
            </div>
            <div className="py-1 max-h-[200px] overflow-y-auto">
              {shifts.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleUpdateShift(activeCell.empId, activeCell.date, s.name)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                    activeCell.currentShift === s.name ? "text-blue-600 bg-blue-50/50" : "text-slate-700"
                  }`}
                >
                  {s.name}
                  {activeCell.currentShift === s.name && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </button>
              ))}
              <button
                onClick={() => handleUpdateShift(activeCell.empId, activeCell.date, "Weekend Off")}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                  activeCell.currentShift === "Weekend Off" ? "text-blue-600 bg-blue-50/50" : "text-slate-700"
                }`}
              >
                Weekend Off
                {activeCell.currentShift === "Weekend Off" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Loading Overlay */}
      {dbLoading && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-[200]">
          <div className="bg-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-600">Connecting to Firestore...</span>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
