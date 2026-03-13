"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { UserMenuDropdown } from "@/components/UserMenuDropdown";
import { DiscoverDropdown } from "@/components/DiscoverDropdown";
import { colors, typography, styles, borderRadius } from "@/lib/design/tokens";

type Role = "athlete" | "club" | null;

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email!);
        
        try {
          // Use the /api/me endpoint to get user and profile data
          const response = await fetch("/api/me");
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn("[Navbar] Profile fetch error:", response.status, response.statusText);

            // Fallback to email initial if profile fetch fails
            setDisplayName(session.user.email?.charAt(0).toUpperCase() || "U");
            setRole(null);
            return;
          }
          
          const data = await response.json();
          // Set display name from profile with fallback to email initial
          const profileName = data.profile?.full_name ?? data.profile?.display_name;
          setDisplayName(profileName || session.user.email?.charAt(0).toUpperCase() || "U");
          
          // Set role from user data
          setRole(data.user?.role as Role);
          
        } catch (error) {
          console.warn("[Navbar] Profile fetch error:", error instanceof Error ? error.message : String(error));
          // Fallback to email initial on error
          setDisplayName(session.user.email?.charAt(0).toUpperCase() || "U");
          setRole(null);
        }
      } else {
        setUserEmail(null);
        setDisplayName(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Primary navigation items - always visible with icons
  const primaryNavItems = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { href: "/", label: "Home", icon: "🏠" },
      { href: "/feed", label: "Feed", icon: "📱" },
      { href: "/opportunities", label: "Opportunities", icon: "⚡" },
      { href: "/messages", label: "Messages", icon: "💬" },
    ];

    // Add role-specific primary items
    if (role === "athlete") {
      return [
        ...base,
        { href: "/post/create", label: "Create", icon: "➕" },
      ];
    }

    if (role === "club") {
      return [
        ...base,
        { href: "/club/create-opportunity", label: "Post", icon: "📝" },
      ];
    }

    return base;
  }, [role]);

  // If user is not authenticated, show login/signup
  if (!userEmail) {
    return (
      <header className="sticky top-0 z-50" style={{ backgroundColor: colors.black, borderBottom: `1px solid ${colors.surface}` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center" style={{ ...styles.buttonBorder, backgroundColor: colors.accent }}>
              <span className="text-base font-black text-white">D</span>
            </div>

            <div className="min-w-0">
              <div style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white }} className="tracking-[-0.03em]">
                Debut
              </div>
              <div className="hidden text-sm md:block" style={{ color: colors.muted }}>
                debut.football
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium transition-all"
              style={{ 
                ...styles.buttonBorder, 
                backgroundColor: "transparent", 
                color: colors.white, 
                border: `1px solid ${colors.surface}`
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium transition-all"
              style={{ 
                ...styles.buttonBorder, 
                backgroundColor: colors.accent, 
                color: colors.white 
              }}
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50" style={{ backgroundColor: colors.black, borderBottom: `1px solid ${colors.surface}` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center" style={{ ...styles.buttonBorder, backgroundColor: colors.accent }}>
              <span className="text-base font-black text-white">D</span>
            </div>

            <div className="min-w-0">
              <div style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white }} className="tracking-[-0.03em]">
                Debut
              </div>
              <div className="hidden text-sm md:block" style={{ color: colors.muted }}>
                debut.football
              </div>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden */}
          <nav className="hidden items-center gap-2 lg:flex">
            {primaryNavItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              // Special handling for Create button - make it a circular FAB
              if (item.href === "/post/create") {
                return (
                  <motion.button
                    key={item.href}
                    onClick={() => router.push('/post/create')}
                    whileHover={{ scale: 1.12, boxShadow: "0 0 32px #7C3AED" }}
                    whileTap={{ scale: 0.92 }}
                    animate={{ 
                      boxShadow: [
                        "0 0 0px #7C3AED", 
                        "0 0 24px #7C3AED88", 
                        "0 0 0px #7C3AED"
                      ] 
                    }}
                    transition={{ 
                      boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <svg width="22" height="22" fill="none" stroke="white" 
                      strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                    </svg>
                  </motion.button>
                );
              }

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium transition-all relative ${
                      active
                        ? ""
                        : ""
                    }`}
                    style={{
                      backgroundColor: active ? 'rgba(124,58,237,0.12)' : "transparent",
                      color: active ? '#F8FAFC' : colors.muted,
                      border: active ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${colors.surface}`,
                      borderRadius: active ? 8 : undefined
                    }}
                  >
                    {item.label}
                    {!active && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.2 }}
                        style={{ originX: 0.5 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
            
            {/* Discover Dropdown */}
            <DiscoverDropdown role={role} />
          </nav>

          {/* User Menu Dropdown */}
          <UserMenuDropdown
            displayName={displayName}
            role={role}
            userEmail={userEmail}
          />
        </div>
      </header>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40" style={{ backgroundColor: colors.black, borderTop: `1px solid ${colors.surface}` }}>
        <div className="flex items-center justify-around px-2 py-3">
          {primaryNavItems.slice(0, 5).map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 text-xs transition-all"
                style={{ color: active ? colors.white : colors.muted }}
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                {active && (
                  <div 
                    className="h-1 w-1 rounded-full mt-1" 
                    style={{ backgroundColor: colors.accent }} 
                  />
                )}
              </Link>
            );
          })}
          
          {/* Mobile user menu indicator */}
          <div className="flex flex-col items-center gap-1 px-3 py-2" style={{ color: colors.muted }}>
            <div className="text-2xl mb-1">👤</div>
            <div className="h-1 w-1 rounded-full mt-1" style={{ backgroundColor: colors.surface }} />
          </div>
        </div>
      </nav>
    </>
  );
}
