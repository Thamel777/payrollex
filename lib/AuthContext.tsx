"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Attempt to fetch role from Firestore
        let userRole = getRoleFromEmail(currentUser.email);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().role) {
            userRole = userDoc.data().role;
          }
        } catch (e) {
          console.warn("Firestore role fetch failed, falling back to email prefix.", e);
        }
        setRole(userRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirect to login if user is not authenticated and path is not /login
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
