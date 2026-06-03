"use client";


import { Settings, Shield, Bell, Users, LayoutDashboard } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
          <div className="space-y-1 z-10">
            <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Configure system preferences, security policies, and integrations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Security Policies</h3>
                <p className="text-xs text-slate-500">Manage password rules & 2FA</p>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
              Configure
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Notification Preferences</h3>
                <p className="text-xs text-slate-500">Email & push notification rules</p>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
              Configure
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Company Profile</h3>
                <p className="text-xs text-slate-500">Update company details & logo</p>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
              Configure
            </button>
          </div>
        </div>
      </div>
  );
}
