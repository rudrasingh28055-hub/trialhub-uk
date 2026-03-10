"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type Role = "athlete" | "club" | null;

interface UserMenuDropdownProps {
  displayName: string | null;
  role: Role;
  userEmail: string | null;
}

export function UserMenuDropdown({ displayName, role, userEmail }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log("[UserMenu] Starting logout...");
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[UserMenu] Logout error:", error);
        alert(`Logout failed: ${error.message}`);
        setIsLoggingOut(false);
        return;
      }
      
      console.log("[UserMenu] Logout successful");
      setIsOpen(false);
      
      // Navigate to login
      router.push("/login");
      router.refresh();
      
    } catch (error) {
      console.error("[UserMenu] Logout exception:", error);
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      alert(`Logout failed: ${errorMessage}`);
      setIsLoggingOut(false);
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case "athlete":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "club":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const getMenuItems = () => {
    if (role === "athlete") {
      return [
        { href: "/athlete/profile", label: "Profile" },
        { href: "/athlete/saved", label: "Saved" },
        { href: "/athlete/applications", label: "Applications" },
        { href: "/athlete/invites", label: "Invites" },
        { href: "/athlete/settings", label: "Settings" },
      ];
    }

    if (role === "club") {
      return [
        { href: "/profile", label: "Profile" },
        { href: "/club/dashboard", label: "Dashboard" },
        { href: "/club/invites", label: "Invites" },
        { href: "/club/settings", label: "Settings" },
      ];
    }

    return [{ href: "/profile", label: "Profile" }];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Menu Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition-all hover:bg-white/10 hover:border-white/20"
      >
        <div className="text-left">
          <div className="text-sm font-medium text-white">
            {displayName || "User"}
          </div>
          {role && (
            <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleColor()}`}>
              {role === "athlete" ? "Athlete" : "Club"}
            </div>
          )}
        </div>
        <div className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-[16px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="p-2">
            {userEmail && (
              <div className="px-3 py-2 text-xs text-slate-400 border-b border-white/5 mb-2">
                {userEmail}
              </div>
            )}
            
            {getMenuItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-sm text-slate-300 rounded-lg transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="border-t border-white/5 mt-2 pt-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full px-3 py-2 text-sm text-red-400 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
