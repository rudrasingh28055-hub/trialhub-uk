"use client";

import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  hoverColor: string;
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
          color: "border-sky-400/30 bg-sky-500/10",
          hoverColor: "hover:border-sky-400/50 hover:bg-sky-500/20",
          badge: "Discovery"
        },
        {
          title: "Applicants",
          description: "Review pipeline applications",
          href: "/club/applications",
          icon: "📋",
          color: "border-emerald-400/30 bg-emerald-500/10",
          hoverColor: "hover:border-emerald-400/50 hover:bg-emerald-500/20",
          badge: "Pipeline"
        },
        {
          title: "Messages",
          description: "Direct conversations",
          href: "/messages",
          icon: "💬",
          color: "border-purple-400/30 bg-purple-500/10",
          hoverColor: "hover:border-purple-400/50 hover:bg-purple-500/20",
          badge: "Contact"
        }
      ]
    : [
        {
          title: "Players",
          description: "Explore athlete profiles",
          href: "/players",
          icon: "👥",
          color: "border-sky-400/30 bg-sky-500/10",
          hoverColor: "hover:border-sky-400/50 hover:bg-sky-500/20",
          badge: "Discovery"
        },
        {
          title: "Opportunities",
          description: "Find career opportunities",
          href: "/opportunities",
          icon: "🎯",
          color: "border-emerald-400/30 bg-emerald-500/10",
          hoverColor: "hover:border-emerald-400/50 hover:bg-emerald-500/20",
          badge: "Career"
        },
        {
          title: "Messages",
          description: "Connect with clubs",
          href: "/messages",
          icon: "💬",
          color: "border-purple-400/30 bg-purple-500/10",
          hoverColor: "hover:border-purple-400/50 hover:bg-purple-500/20",
          badge: "Network"
        }
      ];

  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-white">Quick Actions</h3>
          <p className="mt-2 text-sm text-slate-400">
            {userRole === "club" 
              ? "Manage your recruitment workflow efficiently"
              : "Navigate your football career journey"
            }
          </p>
        </div>
        <div className="rounded-full border border-sky-400/30 bg-gradient-to-r from-sky-500/20 to-blue-500/20 px-4 py-2 text-xs font-bold text-sky-300 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
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
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/50 to-slate-900/50 p-6 transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-slate-950/70 hover:to-slate-900/70 hover:shadow-xl hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Badge */}
            <div className="absolute top-4 right-4">
              <span className="rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {action.badge}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col h-full">
              {/* Icon */}
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${action.color} ${action.hoverColor} transition-all duration-300 mb-4 group-hover:scale-110`}>
                <span className="text-xl">{action.icon}</span>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white group-hover:text-sky-100 transition-colors">
                  {action.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition-colors">
                  {action.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="flex items-center gap-2 mt-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-xs font-semibold">Go</span>
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Quick access to your most important features
        </p>
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-slate-600" />
          <div className="h-1 w-1 rounded-full bg-slate-600" />
          <div className="h-1 w-1 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}
