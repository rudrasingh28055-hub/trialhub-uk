"use client";

import { useState } from "react";
import type { FeedFilter, PostContentType } from "../../lib/feed/types";

interface FeedFilterProps {
  filter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  currentUserId?: string;
}

const contentTypes: { value: PostContentType | 'all'; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "🌐" },
  { value: "highlight", label: "Highlights", icon: "⚡" },
  { value: "training", label: "Training", icon: "🏃" },
  { value: "achievement", label: "Achievements", icon: "🏆" },
  { value: "match_moment", label: "Match Moments", icon: "⚽" },
];

const positions = [
  "Goalkeeper",
  "Centre-Back",
  "Left-Back",
  "Right-Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Left Winger",
  "Right Winger",
  "Striker",
  "Forward",
];

export function FeedFilterBar({ filter, onFilterChange, currentUserId }: FeedFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleContentTypeChange = (value: PostContentType | 'all') => {
    onFilterChange({
      ...filter,
      contentType: value === 'all' ? undefined : value,
    });
  };

  const handleSortChange = (sortBy: FeedFilter['sortBy']) => {
    onFilterChange({ ...filter, sortBy });
  };

  const handlePositionChange = (position: string) => {
    onFilterChange({
      ...filter,
      position: position === filter.position ? undefined : position,
    });
  };

  const handleFollowingToggle = () => {
    if (!currentUserId) return;
    onFilterChange({
      ...filter,
      sortBy: filter.sortBy === 'following' ? 'latest' : 'following',
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-4">
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Content Type Pills */}
        {contentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleContentTypeChange(type.value)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              (type.value === 'all' && !filter.contentType) || filter.contentType === type.value
                ? "border-sky-400 bg-sky-500/20 text-sky-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300"
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Secondary Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sort:</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleSortChange('latest')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter.sortBy === 'latest'
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => handleSortChange('popular')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter.sortBy === 'popular'
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Popular
              </button>
              {currentUserId && (
                <button
                  onClick={handleFollowingToggle}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter.sortBy === 'following'
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  Following
                </button>
              )}
            </div>
          </div>

          {/* Position Filter (when expanded) */}
          {isExpanded && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Position:</span>
              <select
                value={filter.position || ""}
                onChange={(e) => handlePositionChange(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="">All positions</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {isExpanded ? "Less filters" : "More filters"}
          <svg
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Active Filters Display */}
      {(filter.position || filter.contentType) && (
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-xs text-slate-500">Active:</span>
          {filter.contentType && (
            <span className="flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-1 text-xs text-sky-300">
              {contentTypes.find(t => t.value === filter.contentType)?.icon}
              {contentTypes.find(t => t.value === filter.contentType)?.label}
              <button
                onClick={() => handleContentTypeChange('all')}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          {filter.position && (
            <span className="flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-1 text-xs text-violet-300">
              ⚽ {filter.position}
              <button
                onClick={() => handlePositionChange(filter.position!)}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => onFilterChange({ sortBy: 'latest' })}
            className="text-xs text-slate-400 hover:text-white ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
