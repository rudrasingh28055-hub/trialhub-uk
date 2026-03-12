"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { colors, typography, styles, borderRadius } from "../lib/design/tokens";

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
        return { backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}30`, color: colors.success };
      case "club":
        return { backgroundColor: `${colors.accent}10`, border: `1px solid ${colors.accent}30`, color: colors.accent };
      default:
        return { backgroundColor: `${colors.muted}10`, border: `1px solid ${colors.muted}30`, color: colors.muted };
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
        className="flex items-center gap-3 px-4 py-2 transition-all"
        style={{ 
          ...styles.pillBorder,
          backgroundColor: colors.card, 
          border: `1px solid ${colors.surface}`
        }}
      >
        <div className="text-left">
          <div 
            className="text-sm font-medium"
            style={{ 
              color: colors.white,
              fontFamily: typography.display,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            {displayName || "User"}
          </div>
          {role && (
            <div 
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
              style={{ 
                ...styles.pillBorder,
                ...getRoleColor()
              }}
            >
              {role === "athlete" ? "Athlete" : "Club"}
            </div>
          )}
        </div>
        <div 
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: colors.muted }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 overflow-hidden"
          style={{ 
            ...styles.sheetBorder,
            backgroundColor: colors.card, 
            border: `1px solid ${colors.surface}`
          }}
        >
          <div style={{ padding: "8px" }}>
            {userEmail && (
              <div 
                className="px-3 py-2 text-xs mb-2"
                style={{ 
                  color: colors.muted,
                  borderBottom: `1px solid ${colors.surface}`
                }}
              >
                {userEmail}
              </div>
            )}
            
            {getMenuItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-sm rounded-lg transition-colors"
                style={{ 
                  color: colors.white,
                  fontFamily: typography.body
                }}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div style={{ borderTop: `1px solid ${colors.surface}`, marginTop: "8px", paddingTop: "8px" }}>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  color: colors.danger,
                  fontFamily: typography.body
                }}
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
