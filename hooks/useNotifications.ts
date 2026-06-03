"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, writeBatch, doc, orderBy, setDoc, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";

export interface AppNotification {
  id: string;
  userId: string;
  text: string;
  time: string;
  unread: boolean;
  timestamp: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
      });

      // Sort notifications by timestamp descending on the client side
      notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // If empty, seed some dummy notifications for demonstration purposes
      if (notifs.length === 0) {
        seedDummyNotifications(user.uid);
      } else {
        setNotifications(notifs);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const seedDummyNotifications = async (uid: string) => {
    try {
      const batch = writeBatch(db);
      const dummies = [
        { text: "New manual attendance correction request from Nimal Perera", time: "5m ago", unread: true, timestamp: Date.now() },
        { text: "BioStar 2 Auto-Sync completed successfully: 1,245 logs imported", time: "15m ago", unread: true, timestamp: Date.now() - 15 * 60000 },
        { text: "Leave request pending approval for Kavindi Silva", time: "1h ago", unread: false, timestamp: Date.now() - 60 * 60000 },
        { text: "System maintenance scheduled for Sunday at 02:00 AM", time: "1d ago", unread: false, timestamp: Date.now() - 24 * 60 * 60000 },
      ];

      for (const dummy of dummies) {
        const newRef = doc(collection(db, "notifications"));
        batch.set(newRef, { ...dummy, userId: uid });
      }

      await batch.commit();
    } catch (err) {
      console.error("Failed to seed dummy notifications:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (notif.unread) {
          const docRef = doc(db, "notifications", notif.id);
          batch.update(docRef, { unread: false });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return {
    notifications,
    unreadCount: notifications.filter((n) => n.unread).length,
    loading,
    markAllAsRead,
  };
}
