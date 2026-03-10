"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { DiscoverDropdown } from "./DiscoverDropdown";

type Role = "athlete" | "club" | null;

type NavItem = {
  href: string;
  label: string;
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
      console.log("[Navbar] Auth state change:", event, session?.user?.email);
      
      if (session?.user) {
        setUserEmail(session.user.email!);
        
        try {
          // Use the /api/me endpoint to get user and profile data
          const response = await fetch('/api/me');
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Navbar] Profile fetch error:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            setRole(null);
            setDisplayName(null);
            return;
          }
          
          const data = await response.json();
          console.log("[Navbar] Profile data:", data);
          
          // Set display name from profile
          setDisplayName(data.profile?.full_name ?? data.profile?.display_name ?? null);
          
          // Set role from user data
          setRole(data.user?.role as Role);
          
        } catch (error) {
          console.error("[Navbar] Profile fetch error:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          setRole(null);
          setDisplayName(null);
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

  // Primary navigation items - always visible
  const primaryNavItems = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { href: "/", label: "Home" },
      { href: "/feed", label: "Feed" },
      { href: "/opportunities", label: "Opportunities" },
      { href: "/messages", label: "Messages" },
    ];

    // Add role-specific primary items
    if (role === "athlete") {
      return [
        ...base,
        { href: "/post/create", label: "Create Post" },
      ];
    }

    if (role === "club") {
      return [
        ...base,
        { href: "/club/create-opportunity", label: "Post" },
      ];
    }

    return base;
  }, [role]);

  // If user is not authenticated, show login/signup
  if (!userEmail) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-base font-black text-white shadow-lg transition-all duration-300 group-hover:scale-[1.05] group-hover:shadow-sky-500/25">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative">A</span>
            </div>

            <div className="min-w-0">
              <div className="text-2xl font-black tracking-[-0.03em] text-white group-hover:text-sky-100 transition-colors duration-300">
                AthLink
              </div>
              <div className="hidden text-sm text-slate-400 md:block group-hover:text-slate-300 transition-colors duration-300">
                Connecting athletes to opportunity
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-sky-400"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-base font-black text-white shadow-lg transition-all duration-300 group-hover:scale-[1.05] group-hover:shadow-sky-500/25">
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">A</span>
          </div>

          <div className="min-w-0">
            <div className="text-2xl font-black tracking-[-0.03em] text-white group-hover:text-sky-100 transition-colors duration-300">
              AthLink
            </div>
            <div className="hidden text-sm text-slate-400 md:block group-hover:text-slate-300 transition-colors duration-300">
              Connecting athletes to opportunity
            </div>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden items-center gap-2 lg:flex">
          {primaryNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
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

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="lg:hidden border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
        <div className="flex items-center justify-around px-2 py-3">
          {primaryNavItems.slice(0, 5).map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-all ${
                  active
                    ? "text-sky-300"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${
                  active ? "bg-sky-400" : "bg-transparent"
                }`} />
                {item.label}
              </Link>
            );
          })}
          
          {/* Mobile user menu indicator */}
          <div className="flex flex-col items-center gap-1 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">Menu</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
