"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  logout: async () => {},
});

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
        // Attempt to fetch role from Firestore
        let userRole = getRoleFromEmail(currentUser.email);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!isMounted.current) return; // Component unmounted during fetch
          if (userDoc.exists() && userDoc.data().role) {
            userRole = userDoc.data().role;
          }
        } catch (e) {
          if (isAbortError(e)) return; // Silently ignore aborted requests
          console.warn("Firestore role fetch failed, falling back to email prefix.", e);
        }
        if (!isMounted.current) return;
        setRole(userRole);
      } else {
        setRole(null);
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

  return (
    <AuthContext.Provider value={{ user, loading, role, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
