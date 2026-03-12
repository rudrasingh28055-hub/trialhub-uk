"use client";

import Link from "next/link";
import { colors, typography, styles, borderRadius } from "../lib/design/tokens";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
}

interface QuickActionsPanelProps {
  userRole?: "athlete" | "club" | null;
  className?: string;
}

export function QuickActionsPanel({ userRole, className = "" }: QuickActionsPanelProps) {
  const quickActions: QuickAction[] = userRole === "club" 
    ? [
        {
          title: "Players",
          description: "Scout and discover talent",
          href: "/players",
          icon: "👥",
          badge: "Discovery"
        },
        {
          title: "Applicants",
          description: "Review pipeline applications",
          href: "/club/applications",
          icon: "📋",
          badge: "Pipeline"
        },
        {
          title: "Messages",
          description: "Direct conversations",
          href: "/messages",
          icon: "💬",
          badge: "Contact"
        }
      ]
    : [
        {
          title: "Players",
          description: "Explore athlete profiles",
          href: "/players",
          icon: "👥",
          badge: "Discovery"
        },
        {
          title: "Opportunities",
          description: "Find career opportunities",
          href: "/opportunities",
          icon: "🎯",
          badge: "Career"
        },
        {
          title: "Messages",
          description: "Connect with clubs",
          href: "/messages",
          icon: "💬",
          badge: "Network"
        }
      ];

  return (
    <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 
            className="text-2xl font-black"
            style={{ 
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            Quick Actions
          </h3>
          <p 
            className="mt-2 text-sm"
            style={{ color: colors.muted }}
          >
            {userRole === "club" 
              ? "Manage your recruitment workflow efficiently"
              : "Navigate your football career journey"
            }
          </p>
        </div>
        <div 
          className="px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm"
          style={{ 
            ...styles.pillBorder,
            backgroundColor: `${colors.accent}20`, 
            border: `1px solid ${colors.accent}40`,
            color: colors.accent
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full animate-pulse" 
              style={{ backgroundColor: colors.accent }} 
            />
            Active
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
        {quickActions.map((action, index) => (
          <Link
            key={action.title}
            href={action.href}
            className="group relative overflow-hidden p-6 transition-all duration-300"
            style={{ 
              ...styles.sheetBorder,
              backgroundColor: colors.surface, 
              border: `1px solid ${colors.input}`
            }}
          >
            {/* Badge */}
            <div className="absolute top-4 right-4">
              <span 
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm"
                style={{ 
                  ...styles.pillBorder,
                  backgroundColor: colors.input, 
                  border: `1px solid ${colors.surface}`,
                  color: colors.muted
                }}
              >
                {action.badge}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col h-full">
              {/* Icon */}
              <div 
                className="inline-flex h-12 w-12 items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                style={{ 
                  ...styles.buttonBorder,
                  backgroundColor: colors.accent
                }}
              >
                <span className="text-xl">{action.icon}</span>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h4 
                  className="text-lg font-bold transition-colors"
                  style={{ 
                    ...styles.displayHeader,
                    color: colors.white
                  }}
                >
                  {action.title}
                </h4>
                <p 
                  className="mt-2 text-sm leading-6 transition-colors"
                  style={{ color: colors.muted }}
                >
                  {action.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div 
                className="flex items-center gap-2 mt-4 opacity-0 transition-all duration-300"
                style={{ color: colors.accent }}
              >
                <span 
                  className="text-xs font-semibold"
                  style={{ 
                    fontFamily: typography.display,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Go
                </span>
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Hover overlay */}
            <div 
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent}10 0%, transparent 50%)`
              }}
            />
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 flex items-center justify-between">
        <p 
          className="text-xs"
          style={{ color: colors.muted }}
        >
          Quick access to your most important features
        </p>
        <div className="flex items-center gap-2">
          <div 
            className="h-1 w-1 rounded-full" 
            style={{ backgroundColor: colors.surface }} 
          />
          <div 
            className="h-1 w-1 rounded-full" 
            style={{ backgroundColor: colors.surface }} 
          />
          <div 
            className="h-1 w-1 rounded-full" 
            style={{ backgroundColor: colors.surface }} 
          />
        </div>
      </div>
    </div>
  );
}
