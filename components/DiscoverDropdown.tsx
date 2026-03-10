"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Role = "athlete" | "club" | null;

interface DiscoverDropdownProps {
  role?: Role;
  className?: string;
}

const discoverItems = [
  { href: "/players", label: "Players", description: "Discover talented athletes" },
  { href: "/clubs/professional", label: "Professional Clubs", description: "Explore professional opportunities" },
  { href: "/clubs/academies", label: "Academies", description: "Find development programs" },
];

export function DiscoverDropdown({ role, className = "" }: DiscoverDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
          isOpen
            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-2">
          Discover
          <svg 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/95 backdrop-blur-xl shadow-2xl z-50">
          <div className="p-2">
            {discoverItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl p-4 transition-all duration-200 hover:bg-white/10 group"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 group-hover:from-sky-500/30 group-hover:to-blue-500/30 transition-colors">
                    <svg className="h-5 w-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.href === "/players" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      )}
                      {item.href === "/clubs/professional" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      )}
                      {item.href === "/clubs/academies" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
