"use client";

import { Bell, CheckCircle2, Filter } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();
  const [viewMode, setViewMode] = useState<"all" | "unread">("all");

  const displayedNotifications = viewMode === "unread" 
    ? notifications.filter(n => n.unread) 
    : notifications;

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">All Notifications</h2>
              <p className="text-slate-500 text-sm">View and manage your recent alerts and system events.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode("all")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${viewMode === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                All
              </button>
              <button 
                onClick={() => setViewMode("unread")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${viewMode === "unread" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Unread {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px]">{unreadCount}</span>}
              </button>
            </div>
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-sm font-semibold rounded-xl transition-colors border border-slate-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-medium">Loading notifications...</div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No notifications to display.</div>
            ) : (
              displayedNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-6 flex items-start gap-4 transition-colors hover:bg-slate-50 ${notif.unread ? "bg-blue-50/10" : ""}`}
                >
                <div className="mt-1">
                  {notif.unread ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shadow-sm shadow-blue-500/40"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${notif.unread ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                    {notif.text}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">{notif.time}</p>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}
