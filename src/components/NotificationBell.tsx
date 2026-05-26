"use client";

import { useState, useEffect, useRef } from "react";

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  timestamp: number;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vocabpod_user_notifications");
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to parse stored notifications:", e);
      }
    }
  }, []);

  // Listen for new real-time notifications and clear events
  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const { message, type = "info" } = e.detail;
      
      const newNotification: NotificationItem = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(),
        message,
        type,
        timestamp: Date.now(),
        read: false,
      };

      // Native Web Notification Integration
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Vocabpod", {
            body: message,
            icon: "/icon-192.png"
          });
        } catch (e) {
          console.error("Failed to send native notification:", e);
        }
      }

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        localStorage.setItem("vocabpod_user_notifications", JSON.stringify(updated));
        return updated;
      });
    };

    const handleClearNotifications = () => {
      setNotifications([]);
      localStorage.removeItem("vocabpod_user_notifications");
    };

    window.addEventListener("vocabpod_notification", handleNewNotification);
    window.addEventListener("vocabpod_clear_notifications", handleClearNotifications);
    
    return () => {
      window.removeEventListener("vocabpod_notification", handleNewNotification);
      window.removeEventListener("vocabpod_clear_notifications", handleClearNotifications);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("vocabpod_user_notifications", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.removeItem("vocabpod_user_notifications");
  };

  const getRelativeTimeString = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "Just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-card-gray border border-white/15 text-terracotta hover:bg-dark-blush hover:border-terracotta/40 hover:text-light-gray transition-all duration-300 relative group`}
        title="Notifications"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform ${
            unreadCount > 0 ? "animate-pulse" : ""
          }`}
        >
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Glow Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-0.5 -mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-terracotta border border-card-gray items-center justify-center text-[8px] font-black text-light-gray">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="fixed inset-x-4 top-20 md:absolute md:right-0 md:left-auto md:w-[24rem] rounded-3xl bg-card-gray/95 border border-white/10 backdrop-blur-md shadow-[0_10px_50px_rgba(224,75,53,0.15)] z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-absolute-black/40">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-light-gray">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-terracotta/20 border border-terracotta/30 text-terracotta px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[9px] font-bold uppercase tracking-wider text-muted-ash hover:text-terracotta transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[9px] font-bold uppercase tracking-wider text-muted-ash hover:text-terracotta transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex items-center space-x-3 p-6 text-muted-ash">
                <svg className="w-5 h-5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-bold text-light-gray uppercase tracking-wide">You're all caught up</p>
                  <p className="text-[11px] text-muted-ash/70 mt-1">No new notifications at this time.</p>
                </div>
              </div>
            ) : (
              notifications.map((item) => {
                const isAnnouncement = item.message.startsWith("[System Announcement]: ");
                const displayMessage = isAnnouncement 
                  ? item.message.replace("[System Announcement]: ", "") 
                  : item.message;
                const category = isAnnouncement ? "Broadcast" : item.type === "success" ? "Success" : "Admin Message";

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-all duration-300 flex items-start space-x-3 border-b border-white/5 ${
                      !item.read 
                        ? "bg-terracotta/[0.03] hover:bg-terracotta/[0.05]" 
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="flex h-2 w-2 mt-1.5 shrink-0 relative">
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        item.type === "success" ? "bg-green-500" : "bg-terracotta"
                      }`}></span>
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                          item.type === "success" ? "text-green-400" : "text-terracotta"
                        }`}>
                          {category}
                        </span>
                        <span className="text-[10px] text-muted-ash/50 font-medium">
                          {getRelativeTimeString(item.timestamp)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed break-words font-medium ${
                        !item.read ? "text-light-gray font-semibold" : "text-muted-ash"
                      }`}>
                        {displayMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
