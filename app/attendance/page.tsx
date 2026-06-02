"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  Search,
  Download,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  UserCheck,
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Clock3,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle,
  ThumbsUp,
  SlidersHorizontal
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { mockAttendance, Employee, CorrectionRequest } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  query,
  limit
} from "firebase/firestore";

interface AttendanceLog {
  empId: string;
  empName: string;
  department: string;
  shift: string;
  date: string;
  inTime: string;
  outTime: string;
  status: "Present" | "Late" | "Early Leave" | "Absent" | "Missing Punch";
  workHours: string;
  lateMin: number;
}

export default function AttendancePage() {
  const { user, loading: authLoading, role, employeeId } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Comprehensive View State
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`; // YYYY-MM
  });

  // Modal States
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchModalMode, setPunchModalMode] = useState<"add" | "edit">("add");
  const [punchForm, setPunchForm] = useState<{
    empId: string;
    date: string;
    inTime: string;
    outTime: string;
    notes: string;
  }>({
    empId: "",
    date: "",
    inTime: "",
    outTime: "",
    notes: ""
  });

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState<{
    date: string;
    type: "Missing Punch" | "Late Arrival" | "Early Leave" | "Wrong Shift" | "Other";
    reason: string;
    requestedInTime: string;
    requestedOutTime: string;
  }>({
    date: "",
    type: "Missing Punch",
    reason: "",
    requestedInTime: "",
    requestedOutTime: ""
  });

  // Custom Confirmation Modal State
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

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    type: "warning" | "info" | "danger" | "success" = "info",
    confirmText: string = "Confirm",
    cancelText: string = "Cancel",
    event?: any
  ) => {
    let position = undefined;
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
        
        const modalHeight = 150;
        if (top + modalHeight > window.innerHeight - 16) {
          top = rect.top - modalHeight - 8;
        }
        if (top < 16) top = rect.bottom + 8;
        
        position = { top, left };
      } catch {
        // Fallback to center
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

  // Role Gating Helpers
  const isEmployee = role === "Employee";
  const canAddEdit = role === "Admin" || role === "HR Manager";
  const canApprove = role === "Admin" || role === "HR Manager" || role === "Department Manager";
  const canExport = role === "Admin" || role === "HR Manager" || role === "Accounts Officer" || role === "Management" || role === "Department Manager";

  // Seeding historical logs if database is empty
  const checkAndSeedDatabase = async (allEmployees: Employee[]) => {
    try {
      // Check if already seeded (e.g. if the first employee has logs)
      const alreadySeeded = allEmployees.some(emp => emp.attendanceLogs && Object.keys(emp.attendanceLogs).length > 0);
      if (alreadySeeded) return;

      console.log("Seeding historical attendance logs into employees collection...");
      const today = new Date();
      
      for (const emp of allEmployees) {
        const attendanceLogs: Record<string, any> = {};
        
        // Seed for the last 15 days (excluding weekends)
        for (let i = 15; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dayOfWeek = d.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

          const dateStr = d.toISOString().split("T")[0];

          // Generate deterministic status based on emp ID and date
          const strToHash = emp.id + dateStr;
          let hash = 0;
          for (let j = 0; j < strToHash.length; j++) {
            hash = strToHash.charCodeAt(j) + ((hash << 5) - hash);
          }
          const absHash = Math.abs(hash);

          let inTime = "08:30 AM";
          let outTime = "05:30 PM";
          let status: "Present" | "Late" | "Early Leave" | "Absent" | "Missing Punch" = "Present";
          let workHours = "8h 00m";
          let lateMin = 0;

          const mod = absHash % 20;
          if (mod === 0) {
            inTime = "09:15 AM";
            outTime = "05:30 PM";
            status = "Late";
            workHours = "7h 15m";
            lateMin = 45;
          } else if (mod === 1) {
            inTime = "08:25 AM";
            outTime = "04:30 PM";
            status = "Early Leave";
            workHours = "7h 05m";
          } else if (mod === 2) {
            inTime = "--:--";
            outTime = "--:--";
            status = "Absent";
            workHours = "0h 00m";
          } else if (mod === 3) {
            inTime = "08:40 AM";
            outTime = "--:--";
            status = "Missing Punch";
            workHours = "0h 00m";
          }

          attendanceLogs[dateStr] = {
            shift: "General Shift",
            inTime,
            outTime,
            status,
            workHours,
            lateMin
          };
        }

        // Add some mock corrections for specific employees
        const correctionRequests: Record<string, any> = {};
        if (emp.id === "EMP002") {
          const cDate = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          correctionRequests["corr_001"] = {
            id: "corr_001",
            empId: emp.id,
            empName: emp.name,
            department: emp.department,
            date: cDate,
            type: "Late Arrival",
            reason: "Severe traffic block near Kandy Road flyover construction.",
            requestedInTime: "08:30 AM",
            requestedOutTime: "06:15 PM",
            status: "Pending",
            requestedAt: new Date().toISOString()
          };
        } else if (emp.id === "EMP003") {
          const cDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          correctionRequests["corr_002"] = {
            id: "corr_002",
            empId: emp.id,
            empName: emp.name,
            department: emp.department,
            date: cDate,
            type: "Missing Punch",
            reason: "Fingerprint scanner failed to recognize during logout at 5:30 PM.",
            requestedInTime: "08:35 AM",
            requestedOutTime: "05:30 PM",
            status: "Pending",
            requestedAt: new Date().toISOString()
          };
        } else if (emp.id === "EMP007") {
          const cDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          correctionRequests["corr_003"] = {
            id: "corr_003",
            empId: emp.id,
            empName: emp.name,
            department: emp.department,
            date: cDate,
            type: "Missing Punch",
            reason: "Forgot office card and card scanner failed.",
            requestedInTime: "08:30 AM",
            requestedOutTime: "05:35 PM",
            status: "Pending",
            requestedAt: new Date().toISOString()
          };
        }

        // Write directly to employee document
        await updateDoc(doc(db, "employees", emp.id), {
          attendanceLogs,
          correctionRequests
        });
      }

      console.log("Historical seeding completed successfully.");
    } catch (e) {
      console.error("Error seeding historical data:", e);
    }
  };

  // Sync / load database resources
  useEffect(() => {
    setMounted(true);
    if (authLoading || !user) return;

    // Listen to Employees (our single source of truth for everything)
    const unsubEmp = onSnapshot(collection(db, "employees"), async (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Employee);
      });
      list.sort((a, b) => {
        const aNum = parseInt(a.id.replace(/\D/g, "")) || 0;
        const bNum = parseInt(b.id.replace(/\D/g, "")) || 0;
        return aNum - bNum;
      });
      setEmployees(list);
      setLoading(false);

      if (list.length > 0) {
        // Trigger seeding if database is completely empty
        await checkAndSeedDatabase(list);
      }
    }, (error) => {
      console.error("Employees listener failed:", error);
      setLoading(false);
    });

    return () => {
      unsubEmp();
    };
  }, [user, authLoading]);

  // Synchronously compute dailyLogs from employees state
  const dailyLogs = useMemo(() => {
    const list: AttendanceLog[] = [];
    employees.forEach(emp => {
      const log = emp.attendanceLogs?.[selectedDate];
      if (log) {
        list.push({
          empId: emp.id,
          empName: emp.name,
          department: emp.department,
          shift: log.shift || "General Shift",
          date: selectedDate,
          inTime: log.inTime || "--:--",
          outTime: log.outTime || "--:--",
          status: log.status,
          workHours: log.workHours || "0h 00m",
          lateMin: log.lateMin || 0
        });
      }
    });
    return list;
  }, [employees, selectedDate]);

  // Synchronously compute corrections list from employees state
  const corrections = useMemo(() => {
    const list: CorrectionRequest[] = [];
    employees.forEach(emp => {
      if (emp.correctionRequests) {
        Object.values(emp.correctionRequests).forEach(req => {
          list.push(req);
        });
      }
    });
    list.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });
    return list;
  }, [employees]);

  // Synchronously compute employeeLogs from selectedEmp
  const employeeLogs = useMemo(() => {
    if (!selectedEmp) return [];
    
    // Lookup selectedEmp in the live employees state to capture real-time updates
    const liveEmp = employees.find(e => e.id === selectedEmp.id);
    if (!liveEmp || !liveEmp.attendanceLogs) return [];

    const list: AttendanceLog[] = [];
    Object.entries(liveEmp.attendanceLogs).forEach(([dateStr, log]) => {
      list.push({
        empId: liveEmp.id,
        empName: liveEmp.name,
        department: liveEmp.department,
        shift: log.shift || "General Shift",
        date: dateStr,
        inTime: log.inTime || "--:--",
        outTime: log.outTime || "--:--",
        status: log.status,
        workHours: log.workHours || "0h 00m",
        lateMin: log.lateMin || 0
      });
    });
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [employees, selectedEmp]);

  // Lock Employee role to their own profile automatically
  useEffect(() => {
    if (isEmployee && employeeId && employees.length > 0) {
      const ownProfile = employees.find(e => e.id === employeeId);
      if (ownProfile) {
        setSelectedEmp(ownProfile);
      }
    }
  }, [isEmployee, employeeId, employees]);

  // Set default department filter for department managers
  useEffect(() => {
    if (role === "Department Manager" && employees.length > 0 && deptFilter === "All") {
      const mgrEmp = employees.find(e => e.id === employeeId || (user?.email && e.email && e.email.toLowerCase() === user.email.toLowerCase()));
      if (mgrEmp?.department) {
        setDeptFilter(mgrEmp.department);
      }
    }
  }, [role, employees, employeeId, user]);

  // Calculate status and workHours from punch times
  const calculatePunchStatusAndHours = (inTime: string, outTime: string): { status: "Present" | "Late" | "Early Leave" | "Absent" | "Missing Punch"; workHours: string; lateMin: number } => {
    if (!inTime || inTime === "--:--" || !outTime || outTime === "--:--") {
      if ((!inTime || inTime === "--:--") && (!outTime || outTime === "--:--")) {
        return { status: "Absent", workHours: "0h 00m", lateMin: 0 };
      }
      return { status: "Missing Punch", workHours: "0h 00m", lateMin: 0 };
    }

    try {
      const parseTime = (t: string) => {
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return null;
        let hr = parseInt(match[1]);
        const min = parseInt(match[2]);
        const ampm = match[3];
        if (ampm) {
          if (ampm.toUpperCase() === "PM" && hr < 12) hr += 12;
          if (ampm.toUpperCase() === "AM" && hr === 12) hr = 0;
        }
        return hr * 60 + min;
      };

      const inMin = parseTime(inTime);
      const outMin = parseTime(outTime);

      if (inMin === null || outMin === null) {
        return { status: "Missing Punch", workHours: "0h 00m", lateMin: 0 };
      }

      let diff = outMin - inMin;
      if (diff < 0) diff += 24 * 60; // handles overnight shift

      // Subtract 1 hour for break if worked > 5 hours
      const netWorked = diff > 300 ? diff - 60 : diff;
      const hrs = Math.floor(netWorked / 60);
      const mins = netWorked % 60;
      const workHours = `${hrs}h ${String(mins).padStart(2, "0")}m`;

      // General Shift starts at 08:30 AM, grace is 15 mins -> 8:45 AM
      const shiftStartMin = 8 * 60 + 30;
      let lateMin = 0;
      if (inMin > shiftStartMin + 15) {
        lateMin = inMin - shiftStartMin;
      }

      let status: "Present" | "Late" | "Early Leave" = "Present";
      if (lateMin > 0) {
        status = "Late";
      }

      // Check-out before 5:00 PM is Early Leave
      const shiftEndMin = 17 * 60 + 30;
      if (outMin < shiftEndMin - 30) {
        status = "Early Leave";
      }

      return { status, workHours, lateMin };
    } catch (e) {
      return { status: "Present", workHours: "8h 00m", lateMin: 0 };
    }
  };

  // Sync Action - Write to employees collection
  const handleSync = (e?: any) => {
    setIsSyncing(true);
    setTimeout(async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        
        for (const emp of employees) {
          const log = emp.attendanceLogs?.[todayStr];
          if (!log || log.status === "Absent" || log.status === "Missing Punch") {
            const inTime = "08:25 AM";
            const outTime = "05:40 PM";
            const { status, workHours, lateMin } = calculatePunchStatusAndHours(inTime, outTime);
            
            const updatedLogs = {
              ...(emp.attendanceLogs || {}),
              [todayStr]: {
                shift: "General Shift",
                inTime,
                outTime,
                status,
                workHours,
                lateMin
              }
            };
            
            await updateDoc(doc(db, "employees", emp.id), {
              attendanceLogs: updatedLogs
            });
          }
        }
        
        showAlert("Sync Success", "BioStar 2 logs synchronized successfully!", "success", e);
      } catch (e) {
        console.error("Error updating logs on sync:", e);
        showAlert("Sync Error", "Sync failed: " + (e as Error).message, "danger", e);
      } finally {
        setIsSyncing(false);
      }
    }, 1500);
  };

  // Process correction request - Update employee nested document
  const handleCorrectionAction = (req: CorrectionRequest, action: "Approved" | "Rejected", e?: any) => {
    const actionLabel = action === "Approved" ? "Approve" : "Reject";
    showConfirm(
      `${actionLabel} Correction Request`,
      `Are you sure you want to ${action.toLowerCase()} this correction request for ${req.empName} on ${req.date}?`,
      async () => {
        try {
          const emp = employees.find(e => e.id === req.empId);
          if (!emp) throw new Error("Employee not found");

          const updatedCorrections = { ...(emp.correctionRequests || {}) };
          if (updatedCorrections[req.id]) {
            updatedCorrections[req.id] = {
              ...updatedCorrections[req.id],
              status: action,
              processedBy: user?.email || "system@kawdoco.com",
              processedAt: new Date().toISOString()
            };
          }

          const updatePayload: Record<string, any> = {
            correctionRequests: updatedCorrections
          };

          if (action === "Approved") {
            const inTime = req.requestedInTime || "--:--";
            const outTime = req.requestedOutTime || "--:--";
            const { status, workHours, lateMin } = calculatePunchStatusAndHours(inTime, outTime);

            updatePayload.attendanceLogs = {
              ...(emp.attendanceLogs || {}),
              [req.date]: {
                shift: "General Shift",
                inTime,
                outTime,
                status,
                workHours,
                lateMin
              }
            };
          }

          await updateDoc(doc(db, "employees", emp.id), updatePayload);
          showAlert("Success", `Correction request was successfully ${action.toLowerCase()}!`, "success", e);
        } catch (err) {
          console.error("Error processing correction:", err);
          showAlert("Error", "Failed to process correction: " + (err as Error).message, "danger", e);
        }
      },
      action === "Approved" ? "info" : "danger",
      actionLabel,
      "Cancel",
      e
    );
  };

  // Submit manual punch form - Write to employees collection
  const handleSavePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchForm.empId || !punchForm.date) return;

    const emp = employees.find(x => x.id === punchForm.empId);
    if (!emp) return;

    const { status, workHours, lateMin } = calculatePunchStatusAndHours(punchForm.inTime, punchForm.outTime);

    const saveData = async () => {
      try {
        const updatedLogs = {
          ...(emp.attendanceLogs || {}),
          [punchForm.date]: {
            shift: "General Shift",
            inTime: punchForm.inTime || "--:--",
            outTime: punchForm.outTime || "--:--",
            status,
            workHours,
            lateMin,
            notes: punchForm.notes
          }
        };

        await updateDoc(doc(db, "employees", emp.id), {
          attendanceLogs: updatedLogs
        });

        setShowPunchModal(false);
        showAlert("Success", "Attendance record saved successfully!", "success");
      } catch (err) {
        showAlert("Error", "Failed to save record: " + (err as Error).message, "danger");
      }
    };

    showConfirm(
      punchModalMode === "add" ? "Confirm Attendance Add" : "Confirm Attendance Update",
      `Save attendance punch for ${emp.name} on ${punchForm.date} with Check-In "${punchForm.inTime || "--:--"}" and Check-Out "${punchForm.outTime || "--:--"}"?`,
      saveData,
      "info"
    );
  };

  // Submit employee correction request - Write to employees collection
  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !correctionForm.date || !correctionForm.reason) return;

    const corrId = `corr_${Date.now()}`;
    
    try {
      const liveEmp = employees.find(e => e.id === selectedEmp.id);
      if (!liveEmp) throw new Error("Employee not found");

      const updatedCorrections = {
        ...(liveEmp.correctionRequests || {}),
        [corrId]: {
          id: corrId,
          empId: liveEmp.id,
          empName: liveEmp.name,
          department: liveEmp.department,
          date: correctionForm.date,
          type: correctionForm.type,
          reason: correctionForm.reason,
          requestedInTime: correctionForm.requestedInTime || "--:--",
          requestedOutTime: correctionForm.requestedOutTime || "--:--",
          status: "Pending",
          requestedAt: new Date().toISOString()
        }
      };

      await updateDoc(doc(db, "employees", liveEmp.id), {
        correctionRequests: updatedCorrections
      });

      setShowCorrectionModal(false);
      setCorrectionForm({
        date: "",
        type: "Missing Punch",
        reason: "",
        requestedInTime: "",
        requestedOutTime: ""
      });
      showAlert("Success", "Correction request submitted successfully! Pending manager approval.", "success");
    } catch (err) {
      showAlert("Error", "Failed to submit request: " + (err as Error).message, "danger");
    }
  };

  // Initialize all logs for selected date as Absent - Write to employees collection
  const handleInitializeLogs = async (e?: any) => {
    if (employees.length === 0) return;
    
    showConfirm(
      "Initialize Attendance Logs",
      `Initialize attendance records for all ${employees.length} active roster employees for ${selectedDate}? They will be marked as Absent by default.`,
      async () => {
        try {
          for (const emp of employees) {
            const updatedLogs = {
              ...(emp.attendanceLogs || {}),
              [selectedDate]: {
                shift: "General Shift",
                inTime: "--:--",
                outTime: "--:--",
                status: "Absent",
                workHours: "0h 00m",
                lateMin: 0
              }
            };
            await updateDoc(doc(db, "employees", emp.id), {
              attendanceLogs: updatedLogs
            });
          }
          showAlert("Success", "Daily log sheet initialized successfully!", "success", e);
        } catch (err) {
          showAlert("Error", "Failed to initialize logs: " + (err as Error).message, "danger", e);
        }
      },
      "info",
      "Initialize",
      "Cancel",
      e
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ["Employee ID", "Name", "Department", "Shift", "Check In", "Check Out", "Status", "Work Hours"];
    const rows = filteredRecords.map(rec => [
      rec.empId,
      `"${rec.empName.replace(/"/g, '""')}"`,
      rec.department,
      rec.shift,
      rec.inTime,
      rec.outTime,
      rec.status,
      rec.workHours
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // List of active departments
  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(employees.map(e => e.department)))];
  }, [employees]);

  // Filter daily logs
  const filteredRecords = useMemo(() => {
    return dailyLogs.filter(rec => {
      const matchesSearch = rec.empName.toLowerCase().includes(searchTerm.toLowerCase()) || rec.empId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === "All" || rec.department === deptFilter;
      const matchesStatus = statusFilter === "All" || rec.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [dailyLogs, searchTerm, deptFilter, statusFilter]);

  // Compute daily metrics counts
  const stats = useMemo(() => {
    const total = employees.length || 256;
    const presentLogs = dailyLogs.filter(r => r.status === "Present" || r.status === "Late" || r.status === "Early Leave");
    const present = presentLogs.length;
    const absent = dailyLogs.filter(r => r.status === "Absent").length + (employees.length - dailyLogs.length);
    const late = dailyLogs.filter(r => r.status === "Late").length;
    const early = dailyLogs.filter(r => r.status === "Early Leave").length;
    const missing = dailyLogs.filter(r => r.status === "Missing Punch").length;

    return {
      total,
      present,
      absent,
      late,
      early,
      missing,
      presentPct: total > 0 ? ((present / total) * 100).toFixed(1) : "0.0",
      absentPct: total > 0 ? ((absent / total) * 100).toFixed(1) : "0.0",
      latePct: total > 0 ? ((late / total) * 100).toFixed(1) : "0.0",
      earlyPct: total > 0 ? ((early / total) * 100).toFixed(1) : "0.0",
      missingPct: total > 0 ? ((missing / total) * 100).toFixed(1) : "0.0",
    };
  }, [dailyLogs, employees]);

  const pieData = [
    { name: "Present", value: stats.present - stats.late - stats.early > 0 ? stats.present - stats.late - stats.early : stats.present, color: "#10b981" },
    { name: "Absent", value: stats.absent, color: "#ef4444" },
    { name: "Late", value: stats.late, color: "#f97316" },
    { name: "Early Leave", value: stats.early, color: "#eab308" },
  ];

  const timelineData = [
    { time: "08:00 AM", CheckIn: 45, CheckOut: 0 },
    { time: "09:00 AM", CheckIn: 120, CheckOut: 2 },
    { time: "10:00 AM", CheckIn: 30, CheckOut: 5 },
    { time: "12:00 PM", CheckIn: 2, CheckOut: 15 },
    { time: "02:00 PM", CheckIn: 1, CheckOut: 20 },
    { time: "05:00 PM", CheckIn: 0, CheckOut: 135 },
    { time: "06:00 PM", CheckIn: 0, CheckOut: 25 },
  ];

  // Comprehensive Month selection builder
  const monthOptions = useMemo(() => {
    const options = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({ value: `${year}-${month}`, label });
      d.setMonth(d.getMonth() - 1);
    }
    return options;
  }, []);

  // Generate days array for the selected month in comprehensive view
  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
      days.push({
        dateStr: dayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // Compile selected employee stats for comprehensive monthly card
  const monthlyStats = useMemo(() => {
    const days = getDaysInMonth(selectedMonth);
    const workingDays = days.filter(d => !d.isWeekend).length;
    const logsInMonth = employeeLogs.filter(log => log.date.startsWith(selectedMonth));
    
    let present = 0;
    let late = 0;
    let early = 0;
    let absent = 0;
    let missing = 0;
    let totalMins = 0;

    logsInMonth.forEach(log => {
      if (log.status === "Present") present++;
      else if (log.status === "Late") {
        present++;
        late++;
      } else if (log.status === "Early Leave") {
        present++;
        early++;
      } else if (log.status === "Absent") {
        absent++;
      } else if (log.status === "Missing Punch") {
        missing++;
      }

      const match = log.workHours.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        totalMins += parseInt(match[1]) * 60 + parseInt(match[2]);
      }
    });

    // If there is no record for a day in month, it's considered absent if in the past
    const todayStr = new Date().toISOString().split("T")[0];
    let calculatedAbsent = absent;
    days.forEach(day => {
      if (!day.isWeekend && day.dateStr <= todayStr) {
        const hasLog = logsInMonth.some(l => l.date === day.dateStr);
        if (!hasLog) {
          calculatedAbsent++;
        }
      }
    });

    const attendanceRate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const totalHoursStr = `${hrs}h ${mins}m`;

    return {
      workingDays,
      present,
      late,
      early,
      absent: calculatedAbsent,
      missing,
      attendanceRate,
      totalHoursStr
    };
  }, [employeeLogs, selectedMonth]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "Late":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Early Leave":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Absent":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "Missing Punch":
        return "bg-sky-100 text-sky-800 border border-sky-200";
      case "Weekly Off":
        return "bg-slate-100 text-slate-400 border border-slate-200";
      case "Scheduled":
        return "bg-indigo-50 text-indigo-400 border border-indigo-100";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleOpenAddPunch = () => {
    setPunchModalMode("add");
    setPunchForm({
      empId: employees[0]?.id || "",
      date: selectedDate,
      inTime: "08:30 AM",
      outTime: "05:30 PM",
      notes: ""
    });
    setShowPunchModal(true);
  };

  const handleOpenEditPunch = (log: AttendanceLog) => {
    setPunchModalMode("edit");
    setPunchForm({
      empId: log.empId,
      date: log.date,
      inTime: log.inTime,
      outTime: log.outTime,
      notes: ""
    });
    setShowPunchModal(true);
  };

  const handleOpenRequestCorrection = (dateStr: string, log?: AttendanceLog) => {
    setCorrectionForm({
      date: dateStr,
      type: log?.status === "Missing Punch" ? "Missing Punch" : "Other",
      reason: "",
      requestedInTime: log?.inTime && log.inTime !== "--:--" ? log.inTime : "08:30 AM",
      requestedOutTime: log?.outTime && log.outTime !== "--:--" ? log.outTime : "05:30 PM"
    });
    setShowCorrectionModal(true);
  };

  const changeDateByAmount = (amount: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + amount);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 font-semibold text-xs select-none">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Syncing attendance with database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* Metrics Row (Hidden for plain Employee self-service check) */}
      {!isEmployee && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Employees</span>
            <p className="text-xl font-bold text-slate-800 leading-none mt-1">{stats.total}</p>
            <span className="text-[9px] text-slate-400 mt-1 block">Active base roster</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present Today</span>
            <p className="text-xl font-bold text-emerald-600 leading-none mt-1">{stats.present}</p>
            <span className="text-[9px] text-emerald-600 font-bold mt-1 block">{stats.presentPct}% of total</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-rose-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absent Today</span>
            <p className="text-xl font-bold text-rose-600 leading-none mt-1">{stats.absent}</p>
            <span className="text-[9px] text-rose-600 font-bold mt-1 block">{stats.absentPct}% of total</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-orange-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Late Arrivals</span>
            <p className="text-xl font-bold text-orange-600 leading-none mt-1">{stats.late}</p>
            <span className="text-[9px] text-orange-600 font-bold mt-1 block">{stats.latePct}% of total</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-yellow-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Early Departures</span>
            <p className="text-xl font-bold text-yellow-600 leading-none mt-1">{stats.early}</p>
            <span className="text-[9px] text-yellow-600 font-bold mt-1 block">{stats.earlyPct}% of total</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-card-border shadow-xs border-l-4 border-l-sky-500">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missing Punch</span>
            <p className="text-xl font-bold text-sky-600 leading-none mt-1">{stats.missing}</p>
            <span className="text-[9px] text-sky-600 font-bold mt-1 block">{stats.missingPct}% of total</span>
          </div>
        </div>
      )}

      {/* Main Grid: Shows standard attendance dashboard or Employee locked view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN(S): Table (takes 2 cols if drawer open, otherwise 3 cols) */}
        {/* Hidden for plain Employee who gets only their comprehensive view */}
        {!isEmployee && (
          <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-300 lg:col-span-2">
            <div>
              {/* Table Filters */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative flex-1 min-w-[180px]">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name, EMP ID..."
                      className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50 focus:bg-white"
                    />
                  </div>
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
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Early Leave">Early Leave</option>
                    <option value="Absent">Absent</option>
                    <option value="Missing Punch">Missing Punch</option>
                  </select>
                  
                  {/* Date Picker with Arrows */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeDateByAmount(-1)}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 bg-white"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-8 pr-3 py-1.5 w-36 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => changeDateByAmount(1)}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 bg-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {dailyLogs.length === 0 && canAddEdit && (
                    <button
                      onClick={(event) => handleInitializeLogs(event)}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" /> Initialize Sheet
                    </button>
                  )}
                  {canAddEdit && (
                    <button
                      onClick={handleOpenAddPunch}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Manual Entry
                    </button>
                  )}
                  {canExport && (
                    <button
                      onClick={handleExportCSV}
                      disabled={filteredRecords.length === 0}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                    >
                      <Download className="h-4 w-4" /> Export
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-3 px-4">EMP ID</th>
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Shift</th>
                      <th className="py-3 px-4">In Time</th>
                      <th className="py-3 px-4">Out Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Work Hours</th>
                      {canAddEdit && <th className="py-3 px-4 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((rec) => (
                        <tr
                          key={rec.empId}
                          onClick={() => {
                            const emp = employees.find(e => e.id === rec.empId);
                            if (emp) setSelectedEmp(emp);
                          }}
                          className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            selectedEmp?.id === rec.empId ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-800">{rec.empId}</td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-600 border border-slate-200">
                                {rec.empName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                              </div>
                              <span className="hover:text-blue-600 font-bold">{rec.empName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{rec.department}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">{rec.shift}</td>
                          <td className="py-3 px-4 font-bold text-slate-700">{rec.inTime}</td>
                          <td className="py-3 px-4 font-bold text-slate-700">{rec.outTime}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusStyle(rec.status)}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600">{rec.workHours}</td>
                          {canAddEdit && (
                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditPunch(rec)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                                  title="Edit Punch Log"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const emp = employees.find(e => e.id === rec.empId);
                                    if (emp) setSelectedEmp(emp);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                                  title="View Detailed History"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={canAddEdit ? 9 : 8} className="py-12 text-center text-slate-400 font-medium">
                          <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          No logs found matching filters.
                          {dailyLogs.length === 0 && (
                            <p className="text-[10px] text-slate-400 mt-1">This daily attendance sheet has not been initialized yet.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
              <span>Showing 1 to {filteredRecords.length} of {filteredRecords.length} records</span>
              <div className="flex items-center gap-1.5">
                <button disabled className="px-2 py-0.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Prev</button>
                <button className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md">1</button>
                <button disabled className="px-2 py-0.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Slides Open Details (Comprehensive View) or default Analytics Charts */}
        <div className={`space-y-6 ${isEmployee ? "lg:col-span-3" : "lg:col-span-1"}`}>
          
          {/* A. Selected Employee: Comprehensive Attendance History Panel */}
          {selectedEmp ? (
            <div className="bg-white rounded-2xl border border-card-border shadow-md overflow-hidden flex flex-col min-h-[35rem] animate-fade-in">
              {/* Profile Card Header */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 text-white relative">
                
                {/* Close Button (Hidden for employees locked to their own view) */}
                {!isEmployee && (
                  <button
                    onClick={() => setSelectedEmp(null)}
                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-base text-white border border-white/20">
                    {selectedEmp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold tracking-tight">{selectedEmp.name}</h3>
                    <p className="text-[10px] text-slate-300 font-medium">{selectedEmp.designation} • {selectedEmp.department}</p>
                    <span className="inline-flex px-1.5 py-0.1 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-bold mt-1">
                      ID: {selectedEmp.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Month Selector & History Panel */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Comprehensive Sheet</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-white"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Monthly Stats Cards Grid */}
              <div className="p-4 grid grid-cols-3 gap-2.5 bg-slate-50/50 border-b border-slate-100">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Rate</span>
                  <p className="text-sm font-extrabold text-blue-600 mt-0.5">{monthlyStats.attendanceRate}%</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Late/Absent</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                    <span className="text-orange-600">{monthlyStats.late}L</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-rose-600">{monthlyStats.absent}A</span>
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Hours</span>
                  <p className="text-xs font-extrabold text-slate-700 mt-1.5 truncate">{monthlyStats.totalHoursStr}</p>
                </div>
              </div>

              {/* Day-by-Day Historical List */}
              <div className="flex-1 overflow-y-auto max-h-[22rem] divide-y divide-slate-100 p-2">
                {getDaysInMonth(selectedMonth).map(day => {
                  const log = employeeLogs.find(l => l.date === day.dateStr);
                  
                  // Determine status for days without logs
                  let status = "Scheduled";
                  let inTime = "--:--";
                  let outTime = "--:--";
                  let hours = "-";
                  
                  if (log) {
                    status = log.status;
                    inTime = log.inTime;
                    outTime = log.outTime;
                    hours = log.workHours;
                  } else if (day.isWeekend) {
                    status = "Weekly Off";
                  } else {
                    const todayStr = new Date().toISOString().split("T")[0];
                    if (day.dateStr <= todayStr) {
                      status = "Absent";
                    }
                  }

                  return (
                    <div key={day.dateStr} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="text-center w-7 shrink-0">
                          <span className="text-[13px] font-black text-slate-700 block leading-none">{day.dayNum}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{day.dayName}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`inline-flex px-1.5 py-0.2 rounded text-[8px] font-bold ${getStatusStyle(status)}`}>
                            {status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 block">
                            {inTime} - {outTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500">{hours !== "0h 00m" ? hours : "-"}</span>
                        
                        {/* Inline Actions */}
                        {canAddEdit ? (
                          <button
                            onClick={() => {
                              if (log) {
                                handleOpenEditPunch(log);
                              } else {
                                setPunchModalMode("add");
                                setPunchForm({
                                  empId: selectedEmp.id,
                                  date: day.dateStr,
                                  inTime: "08:30 AM",
                                  outTime: "05:30 PM",
                                  notes: ""
                                });
                                setShowPunchModal(true);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                            title={log ? "Modify Punch" : "Add Manual Punch"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          // Employees / managers can request correction for anomalies
                          (status === "Absent" || status === "Missing Punch" || status === "Late" || status === "Early Leave") && (
                            <button
                              onClick={() => handleOpenRequestCorrection(day.dateStr, log)}
                              className="p-1 text-slate-400 hover:text-orange-600 rounded hover:bg-orange-50"
                              title="Request Correction"
                            >
                              <FileCheck2 className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Personal Actions Section */}
              {isEmployee && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Self-Service Portal</span>
                  <button
                    onClick={() => handleOpenRequestCorrection(new Date().toISOString().split("T")[0])}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer transition-all"
                  >
                    Submit Correction Request
                  </button>
                </div>
              )}
            </div>
          ) : (
            // B. Default State: Render Overall Daily Analytics Charts
            <>
              {/* Summary Donut */}
              <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Attendance Distribution</h3>
                  <p className="text-xs text-slate-400">Total active headcount status review</p>
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
                    <span className="text-xs text-slate-400">Loading chart...</span>
                  )}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-slate-800">{stats.present}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Present</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-50 flex justify-between text-[10px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span>Pres: {stats.present}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    <span>Late: {stats.late}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <span>Abs: {stats.absent}</span>
                  </div>
                </div>
              </div>

              {/* Today's Punch Trend */}
              <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Today's Punch Trend</h3>
                  <p className="text-xs text-slate-400">Sync load check-in vs check-out</p>
                </div>
                <div className="h-44 mt-4">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} style={{ fontSize: "9px", fill: "#94a3b8" }} />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: "9px", fill: "#94a3b8" }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="CheckIn" stroke="#3b82f6" strokeWidth={2} dot={false} name="Check In" />
                        <Line type="monotone" dataKey="CheckOut" stroke="#10b981" strokeWidth={2} dot={false} name="Check Out" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-xs text-slate-400">Loading trend...</span>
                  )}
                </div>
              </div>

              {/* Device Sync Info Box */}
              <div className="bg-white p-6 rounded-2xl border border-card-border shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Fingerprint className="h-4.5 w-4.5 text-blue-600" />
                      BioStar 2 Machine
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-full border border-emerald-200">
                      Connected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium">Device Name</span>
                      <p className="font-bold text-slate-700">BS2-Core</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium">IP Address</span>
                      <p className="font-bold text-slate-700">192.168.1.201</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium">Last Sync</span>
                      <p className="font-bold text-slate-700">Today, 10:15 AM</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium">Logs Today</span>
                      <p className="font-bold text-slate-700">1,245 punch logs</p>
                    </div>
                  </div>
                </div>
                {canAddEdit ? (
                  <button
                    onClick={(event) => handleSync(event)}
                    disabled={isSyncing}
                    className="w-full mt-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-70 focus:outline-none cursor-pointer bg-white"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Synchronizing logs..." : "Sync Now"}
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 italic text-center pt-4">Automatic synchronization active</div>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Manual Corrections Row (Hidden for plain Employees) */}
      {!isEmployee && (
        <div className="bg-white rounded-2xl border border-card-border shadow-xs overflow-hidden flex flex-col justify-between w-full mt-6">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Manual Correction Requests</h3>
                <p className="text-xs text-slate-400">Employee punch modification adjustments</p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[12rem]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Request Date</th>
                    <th className="py-2.5 px-4">Adjustment Type</th>
                    <th className="py-2.5 px-4">Requested Punch</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Status</th>
                    {canApprove && <th className="py-2.5 px-4 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {corrections.length > 0 ? (
                    corrections.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-bold text-slate-700">{item.empName}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{item.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-600">{item.type}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[10px] text-slate-600">
                          IN: {item.requestedInTime || "--:--"} | OUT: {item.requestedOutTime || "--:--"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium max-w-xs truncate" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              item.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : item.status === "Rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        {canApprove && (
                          <td className="py-3 px-4 text-center">
                            {item.status === "Pending" ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(event) => handleCorrectionAction(item, "Approved", event)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Approve
                                </button>
                                <button
                                  onClick={(event) => handleCorrectionAction(item, "Rejected", event)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[10px] rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                                >
                                  <XCircle className="h-3 w-3" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canApprove ? 7 : 6} className="py-8 text-center text-slate-400 font-medium">
                        No correction requests logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Manual Add / Edit Punch Record */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock3 className="h-4.5 w-4.5 text-blue-600" />
                {punchModalMode === "add" ? "Add Manual Attendance Record" : "Edit Attendance Record"}
              </h3>
              <button
                onClick={() => setShowPunchModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePunch} className="space-y-4 mt-4">
              
              {/* Employee Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Employee</label>
                <select
                  disabled={punchModalMode === "edit"}
                  value={punchForm.empId}
                  onChange={(e) => setPunchForm(prev => ({ ...prev, empId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  disabled={punchModalMode === "edit"}
                  value={punchForm.date}
                  onChange={(e) => setPunchForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                  required
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check In Time</label>
                  <input
                    type="text"
                    value={punchForm.inTime}
                    onChange={(e) => setPunchForm(prev => ({ ...prev, inTime: e.target.value }))}
                    placeholder="E.g. 08:30 AM"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check Out Time</label>
                  <input
                    type="text"
                    value={punchForm.outTime}
                    onChange={(e) => setPunchForm(prev => ({ ...prev, outTime: e.target.value }))}
                    placeholder="E.g. 05:30 PM"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason / Correction Notes</label>
                <textarea
                  rows={3}
                  value={punchForm.notes}
                  onChange={(e) => setPunchForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Explain reason for manual entry..."
                  className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Employee Correction Request Form */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileCheck2 className="h-4.5 w-4.5 text-orange-600" />
                Submit Punch Correction Request
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4 mt-4">
              
              {/* Info fields */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Requesting For</span>
                <p className="text-xs font-bold text-slate-700">{selectedEmp?.name} ({selectedEmp?.id})</p>
                <p className="text-[10px] text-slate-500 font-medium">Date: <span className="font-bold text-slate-700">{correctionForm.date}</span></p>
              </div>

              {/* Request Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adjustment Type</label>
                <select
                  value={correctionForm.type}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="Missing Punch">Missing Punch</option>
                  <option value="Late Arrival">Late Arrival</option>
                  <option value="Early Leave">Early Leave</option>
                  <option value="Wrong Shift">Wrong Shift</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Requested times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested In Time</label>
                  <input
                    type="text"
                    value={correctionForm.requestedInTime}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, requestedInTime: e.target.value }))}
                    placeholder="E.g. 08:30 AM"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested Out Time</label>
                  <input
                    type="text"
                    value={correctionForm.requestedOutTime}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, requestedOutTime: e.target.value }))}
                    placeholder="E.g. 05:30 PM"
                    className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Correction</label>
                <textarea
                  rows={3}
                  required
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why the system log requires correction..."
                  className="w-full border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 z-[100] bg-black/15 backdrop-blur-[1px] select-none p-4 animate-fade-in-fast"
          onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        >
          <div 
            className="absolute bg-white rounded-2xl w-full max-w-[320px] shadow-2xl border border-slate-100 p-5 space-y-4 z-[101] animate-pop-in"
            style={confirmModal.position ? {
              position: 'fixed',
              top: confirmModal.position.top,
              left: confirmModal.position.left
            } : {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '380px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-full shrink-0 ${
                confirmModal.type === "danger" 
                  ? "bg-rose-50 text-rose-600 border border-rose-100" 
                  : confirmModal.type === "warning"
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : confirmModal.type === "success"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}>
                {confirmModal.type === "danger" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : confirmModal.type === "warning" ? (
                  <AlertCircle className="h-5 w-5" />
                ) : confirmModal.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-xs leading-normal">
                  {confirmModal.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {confirmModal.cancelText && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-3.5 py-1.5 text-white font-bold text-[10px] rounded-lg transition-all shadow-md cursor-pointer ${
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
      )}

    </div>
  );
}
