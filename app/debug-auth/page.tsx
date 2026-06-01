"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";

export default function DebugAuthPage() {
  const { user, role, permissionsMatrix, isAllowed } = useAuth();
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbPermissions, setDbPermissions] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setDbUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const permSnap = await getDoc(doc(db, "users", "permissions_matrix"));
        if (permSnap.exists()) {
          setDbPermissions(permSnap.data());
        }
      } catch (err: any) {
        setError(err.message || "Error fetching data");
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen space-y-6 font-mono text-xs">
      <h1 className="text-xl font-bold text-blue-400 font-sans">Authentication & Permission Debugger</h1>

      <div className="bg-slate-800 p-4 rounded-lg space-y-2 border border-slate-700">
        <h2 className="text-sm font-bold text-white font-sans">Current Session Status</h2>
        <p>Email: {user?.email || "Not logged in"}</p>
        <p>UID: {user?.uid || "N/A"}</p>
        <p>Role (from Context): {role || "N/A"}</p>
        <p>Is Allowed to "/employees": {isAllowed("/employees") ? "TRUE" : "FALSE"}</p>
        <p>Is Allowed to "/payroll": {isAllowed("/payroll") ? "TRUE" : "FALSE"}</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 overflow-auto max-h-96">
          <h2 className="text-sm font-bold text-white font-sans mb-2">Firestore Users Collection</h2>
          <pre>{JSON.stringify(dbUsers, null, 2)}</pre>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 overflow-auto max-h-96">
          <h2 className="text-sm font-bold text-white font-sans mb-2">Firestore Permissions Matrix Settings</h2>
          <pre>{JSON.stringify(dbPermissions, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
