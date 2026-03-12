"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/server";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "@/lib/design/tokens";

interface TabItem {
  id: string;
  href: string;
  icon: string;
  activeIcon?: string;
  label: string;
}

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("feed");

  const tabs: TabItem[] = [
    {
      id: "feed",
      href: "/",
      icon: "🏠",
      label: "Feed"
    },
    {
      id: "discover",
      href: "/players",
      icon: "🔍",
      label: "Discover"
    },
    {
      id: "create",
      href: "/create",
      icon: "➕",
      label: "Create"
    },
    {
      id: "profile",
      href: "/profile",
      icon: "👤",
      label: "Profile"
    },
    {
      id: "messages",
      href: "/messages",
      icon: "💬",
      label: "Messages"
    }
  ];

  const handleTabClick = (tab: TabItem) => {
    setActiveTab(tab.id);
    router.push(tab.href);
  };

  // Don't show on certain pages
  if (pathname?.startsWith("/auth") || pathname?.startsWith("/api")) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background with pitch grid */}
      <div 
        className="absolute inset-0"
        style={{ 
          ...pitchGrid,
          backgroundColor: colors.obsidian,
          opacity: 0.9
        }}
      />
      
      {/* Navigation container */}
      <div 
        className="relative mx-auto max-w-md"
        style={{ 
          ...glassPanel,
          margin: "16px",
          borderRadius: borderRadius.large,
          borderTop: `1px solid ${colors.glass.border}`,
          borderLeft: `1px solid ${colors.glass.border}`,
          borderRight: `1px solid ${colors.glass.border}`,
          backdropFilter: "backdrop-blur-xl(20px)"
        }}
      >
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || activeTab === tab.id;
            const isCreate = tab.id === "create";

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="relative flex flex-col items-center justify-center p-2 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: isCreate ? "56px" : "48px",
                  height: isCreate ? "56px" : "48px",
                  borderRadius: isCreate ? borderRadius.pill : borderRadius.small,
                  ...(isCreate && {
                    background: gradient.violet,
                    boxShadow: "0 8px 32px rgba(124, 58, 237, 0.3)",
                    border: "none"
                  }),
                  ...(!isCreate && isActive && {
                    backgroundColor: `${colors.electricViolet}20`,
                    border: `1px solid ${colors.electricViolet}40`
                  })
                }}
              >
                {/* Icon */}
                <span 
                  className="text-lg"
                  style={{ 
                    color: isCreate ? colors.white : (isActive ? colors.electricViolet : colors.muted),
                    fontSize: isCreate ? "24px" : "20px"
                  }}
                >
                  {tab.icon}
                </span>

                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && !isCreate && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2"
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: colors.electricViolet
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Glow effect for create button */}
                {isCreate && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: gradient.violet,
                      filter: "blur(8px)",
                      opacity: 0.4,
                      zIndex: -1
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
