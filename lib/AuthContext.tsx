"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  permissionsMatrix: any[] | null;
  isAllowed: (href: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  permissionsMatrix: null,
  isAllowed: () => false,
  logout: async () => {},
});

const defaultMatrix = [
  {
    module: "Employee Management",
    permissions: [
      { name: "View Employees", admin: "full", hr: "full", accounts: "read", manager: "read", employee: "read", management: "read" },
      { name: "Add/Edit Employees", admin: "full", hr: "full", accounts: "none", manager: "none", employee: "none", management: "none" },
      { name: "Delete Employees", admin: "full", hr: "write", accounts: "none", manager: "none", employee: "none", management: "none" },
      { name: "Employee Documents", admin: "full", hr: "full", accounts: "read", manager: "none", employee: "read", management: "none" },
    ]
  },
  {
    module: "Attendance Management",
    permissions: [
      { name: "View Attendance Logs", admin: "full", hr: "full", accounts: "read", manager: "full", employee: "read", management: "read" },
      { name: "Approve/Reject Attendance", admin: "full", hr: "full", accounts: "none", manager: "full", employee: "none", management: "none" },
      { name: "Manual Attendance Correction", admin: "full", hr: "write", accounts: "none", manager: "write", employee: "none", management: "none" },
    ]
  },
  {
    module: "Leave Management",
    permissions: [
      { name: "Apply Leave", admin: "full", hr: "full", accounts: "full", manager: "full", employee: "full", management: "full" },
      { name: "Approve/Reject Leave", admin: "full", hr: "full", accounts: "none", manager: "full", employee: "none", management: "none" },
      { name: "View Leave Reports", admin: "full", hr: "full", accounts: "read", manager: "read", employee: "read", management: "read" },
    ]
  },
  {
    module: "Payroll Management",
    permissions: [
      { name: "Process Payroll", admin: "full", hr: "write", accounts: "full", manager: "none", employee: "none", management: "none" },
      { name: "Payroll Approvals", admin: "full", hr: "none", accounts: "none", manager: "none", employee: "none", management: "read" },
      { name: "Generate Payslips", admin: "full", hr: "full", accounts: "full", manager: "none", employee: "none", management: "none" },
      { name: "View Salary Reports", admin: "full", hr: "read", accounts: "full", manager: "none", employee: "none", management: "read" },
    ]
  },
  {
    module: "Reports",
    permissions: [
      { name: "View Dashboard", admin: "full", hr: "full", accounts: "full", manager: "full", employee: "read", management: "full" },
      { name: "View Reports", admin: "full", hr: "full", accounts: "full", manager: "read", employee: "none", management: "full" },
      { name: "Export Reports", admin: "full", hr: "full", accounts: "full", manager: "none", employee: "none", management: "full" },
    ]
  },
  {
    module: "System Settings",
    permissions: [
      { name: "User & Role Management", admin: "full", hr: "none", accounts: "none", manager: "none", employee: "none", management: "none" },
      { name: "System Configuration", admin: "full", hr: "none", accounts: "none", manager: "none", employee: "none", management: "none" },
      { name: "Audit Logs", admin: "full", hr: "read", accounts: "none", manager: "none", employee: "none", management: "none" },
    ]
  }
];

const roleKeys: Record<string, string> = {
  "Admin": "admin",
  "HR Manager": "hr",
  "Accounts Officer": "accounts",
  "Department Manager": "manager",
  "Employee": "employee",
  "Management": "management"
};

export const checkPermission = (role: string | null, href: string, matrix: any[] | null): boolean => {
  if (!role) return false;
  if (role === "Admin") return true;

  const currentMatrix = matrix || defaultMatrix;
  const roleKey = roleKeys[role];
  if (!roleKey) return false;

  const getPermissionValue = (permName: string): string => {
    for (const group of currentMatrix) {
      for (const perm of group.permissions) {
        if (perm.name === permName) {
          return perm[roleKey] || "none";
        }
      }
    }
    return "none";
  };

  const hasAccess = (permName: string) => {
    const val = getPermissionValue(permName);
    return val !== "none" && val !== "na";
  };

  switch (href) {
    case "/":
      return hasAccess("View Dashboard");

    case "/employees":
      return hasAccess("View Employees");

    case "/attendance":
      return hasAccess("View Attendance Logs");

    case "/shifts":
      return hasAccess("View Attendance Logs") && role !== "Employee";

    case "/leave":
      return hasAccess("Apply Leave") || hasAccess("View Leave Reports");

    case "/overtime":
      return (hasAccess("View Attendance Logs") || hasAccess("Process Payroll")) && role !== "Employee" && role !== "Management";

    case "/payroll":
      return hasAccess("Process Payroll") || hasAccess("Payroll Approvals");

    case "/allowances-deductions":
      return hasAccess("Process Payroll");

    case "/payslips":
      return hasAccess("Generate Payslips") || role === "Employee"; // Employees can view their own payslips

    case "/biostar-integration":
      return hasAccess("System Configuration") || hasAccess("Audit Logs");

    case "/user-roles":
      return hasAccess("User & Role Management");

    case "/debug-auth":
      return true;

    default:
      return false;
  }
};

const getRoleFromEmail = (email: string | null): string => {
  if (!email) return "Employee";
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.startsWith("admin")) return "Admin";
  if (lowerEmail.startsWith("hr")) return "HR Manager";
  if (lowerEmail.startsWith("accounts")) return "Accounts Officer";
  if (lowerEmail.startsWith("dm")) return "Department Manager";
  if (lowerEmail.startsWith("employee")) return "Employee";
  if (lowerEmail.startsWith("management")) return "Management";
  return "Employee"; // fallback
};

/** Check if an error is an AbortError (request cancelled due to unmount/navigation) */
const isAbortError = (e: unknown): boolean => {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof Error && e.message === "The user aborted a request.") return true;
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    isMounted.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted.current) return;

      // Reset loading on every auth state change so the UI shows a spinner
      // instead of "Access Denied" while the role is being fetched
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        // Attempt to fetch role and permissions matrix from Firestore
        let userRole = getRoleFromEmail(currentUser.email);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (!isMounted.current) return; // Component unmounted during fetch
          if (userDoc.exists() && userDoc.data().role) {
            userRole = userDoc.data().role;
          } else {
            // Write the user info to Firestore so they show up in user list
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              role: userRole,
              createdAt: new Date().toISOString()
            });
          }

          // Fetch permissions matrix settings (stored in users collection to comply with firestore rules)
          const permDoc = await getDoc(doc(db, "users", "permissions_matrix"));
          if (permDoc.exists() && permDoc.data().matrix) {
            setPermissionsMatrix(permDoc.data().matrix);
          }
        } catch (e) {
          if (isAbortError(e)) return; // Silently ignore aborted requests
          console.warn("Firestore data fetch failed, using fallbacks.", e);
        }
        if (!isMounted.current) return;
        setRole(userRole);
      } else {
        setRole(null);
        setPermissionsMatrix(null);
      }
      if (isMounted.current) setLoading(false);
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);

  // Redirect to login if user is not authenticated and path is not /login
  useEffect(() => {
    if (!loading) {
      try {
        if (!user && pathname !== "/login") {
          router.push("/login");
        } else if (user && pathname === "/login") {
          router.push("/");
        }
      } catch {
        // Swallow navigation errors (AbortError from superseded route transitions)
      }
    }
  }, [user, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    // Navigation to /login is handled by the redirect useEffect above —
    // do NOT call router.push() here to avoid duplicate/competing navigations
  };

  const isAllowed = (href: string): boolean => {
    return checkPermission(role, href, permissionsMatrix);
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, permissionsMatrix, isAllowed, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
