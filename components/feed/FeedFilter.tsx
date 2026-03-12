"use client";

import { useState } from "react";
import type { FeedFilter, PostContentType } from "../../lib/feed/types";
import { colors, typography, styles, borderRadius } from "../../lib/design/tokens";

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
    <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "16px" }}>
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Content Type Pills */}
        {contentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleContentTypeChange(type.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
            style={{ 
              ...styles.pillBorder,
              backgroundColor: (type.value === 'all' && !filter.contentType) || filter.contentType === type.value 
                ? `${colors.accent}20` 
                : 'transparent',
              color: (type.value === 'all' && !filter.contentType) || filter.contentType === type.value 
                ? colors.accent 
                : colors.muted,
              border: (type.value === 'all' && !filter.contentType) || filter.contentType === type.value 
                ? `1px solid ${colors.accent}40` 
                : `1px solid ${colors.surface}`
            }}
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
            <span style={{ fontSize: "12px", color: colors.muted }}>Sort:</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleSortChange('latest')}
                className="px-3 py-1.5 text-xs font-medium transition-colors rounded-lg"
                style={{ 
                  backgroundColor: filter.sortBy === 'latest' ? colors.surface : 'transparent',
                  color: filter.sortBy === 'latest' ? colors.white : colors.muted,
                  ...styles.buttonBorder
                }}
              >
                Latest
              </button>
              <button
                onClick={() => handleSortChange('popular')}
                className="px-3 py-1.5 text-xs font-medium transition-colors rounded-lg"
                style={{ 
                  backgroundColor: filter.sortBy === 'popular' ? colors.surface : 'transparent',
                  color: filter.sortBy === 'popular' ? colors.white : colors.muted,
                  ...styles.buttonBorder
                }}
              >
                Popular
              </button>
              {currentUserId && (
                <button
                  onClick={handleFollowingToggle}
                  className="px-3 py-1.5 text-xs font-medium transition-colors rounded-lg"
                  style={{ 
                    backgroundColor: filter.sortBy === 'following' ? `${colors.success}20` : 'transparent',
                    color: filter.sortBy === 'following' ? colors.success : colors.muted,
                    border: filter.sortBy === 'following' ? `1px solid ${colors.success}40` : '1px solid transparent',
                    ...styles.buttonBorder
                  }}
                >
                  Following
                </button>
              )}
            </div>
          </div>

          {/* Position Filter (when expanded) */}
          {isExpanded && (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "12px", color: colors.muted }}>Position:</span>
              <select
                value={filter.position || ""}
                onChange={(e) => handlePositionChange(e.target.value)}
                className="px-3 py-1.5 text-xs transition-all rounded-lg"
                style={{ 
                  backgroundColor: colors.input, 
                  border: `1px solid ${colors.surface}`, 
                  color: colors.white,
                  ...styles.buttonBorder
                }}
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
          className="text-xs transition-colors flex items-center gap-1"
          style={{ color: colors.muted }}
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
        <div className="mt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${colors.surface}`, paddingTop: "12px" }}>
          <span style={{ fontSize: "12px", color: colors.muted }}>Active:</span>
          {filter.contentType && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs"
              style={{ 
                ...styles.pillBorder,
                backgroundColor: `${colors.accent}10`, 
                border: `1px solid ${colors.accent}30`,
                color: colors.accent
              }}
            >
              {contentTypes.find(t => t.value === filter.contentType)?.icon}
              {contentTypes.find(t => t.value === filter.contentType)?.label}
              <button
                onClick={() => handleContentTypeChange('all')}
                className="ml-1 hover:text-white"
                style={{ color: colors.accent }}
              >
                ×
              </button>
            </span>
          )}
          {filter.position && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs"
              style={{ 
                ...styles.pillBorder,
                backgroundColor: `${colors.accent}10`, 
                border: `1px solid ${colors.accent}30`,
                color: colors.accent
              }}
            >
              ⚽ {filter.position}
              <button
                onClick={() => handlePositionChange(filter.position!)}
                className="ml-1 hover:text-white"
                style={{ color: colors.accent }}
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => onFilterChange({ sortBy: 'latest' })}
            className="text-xs ml-auto"
            style={{ color: colors.muted }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
