"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "../../lib/design/tokens";

interface Evaluation {
  playerId: string;
  playerName: string;
  position: string;
  date: string;
  overallRating: number;
  criteria: {
    technical: number;
    tactical: number;
    physical: number;
    mental: number;
  };
  notes: string;
  status: "pending" | "reviewed" | "approved";
}

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("evaluations");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  // Mock data - replace with actual API call
  const evaluations: Evaluation[] = [
    {
      playerId: "1",
      playerName: "Carlos Silva",
      position: "Forward",
      date: "2024-03-15",
      overallRating: 92,
      criteria: {
        technical: 90,
        tactical: 88,
        physical: 94,
        mental: 85
      },
      notes: "Exceptional pace and finishing. Needs work on defensive positioning.",
      status: "approved"
    },
    {
      playerId: "2",
      playerName: "Marco Rossi",
      position: "Midfielder", 
      date: "2024-03-14",
      overallRating: 88,
      criteria: {
        technical: 92,
        tactical: 85,
        physical: 82,
        mental: 90
      },
      notes: "Excellent vision and passing. Could improve physical strength.",
      status: "reviewed"
    },
    {
      playerId: "3",
      playerName: "James Wilson",
      position: "Defender",
      date: "2024-03-13",
      overallRating: 85,
      criteria: {
        technical: 82,
        tactical: 88,
        physical: 86,
        mental: 80
      },
      notes: "Strong defensive awareness. Technical skills need refinement.",
      status: "pending"
    }
  ];

  const stats = {
    totalEvaluations: evaluations.length,
    pending: evaluations.filter(e => e.status === "pending").length,
    reviewed: evaluations.filter(e => e.status === "reviewed").length,
    approved: evaluations.filter(e => e.status === "approved").length,
    averageRating: Math.round(evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return colors.warning;
      case "reviewed": return colors.electricViolet;
      case "approved": return colors.success;
      default: return colors.muted;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: "Pending", color: colors.warning },
      reviewed: { label: "Reviewed", color: colors.electricViolet },
      approved: { label: "Approved", color: colors.success }
    };
    return badges[status as keyof typeof badges];
  };

  const createRadarData = (criteria: Evaluation["criteria"]) => [
    { label: "Technical", value: criteria.technical },
    { label: "Tactical", value: criteria.tactical },
    { label: "Physical", value: criteria.physical },
    { label: "Mental", value: criteria.mental }
  ];

  const createRadarPath = (data: typeof createRadarData) => {
    const angleStep = (Math.PI * 2) / data.length;
    const points = data.map((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = 50 + (item.value / 100) * 40 * Math.cos(angle);
      const y = 50 + (item.value / 100) * 40 * Math.sin(angle);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")} Z`;
  };

  return (
    <AppLayout>
      <div className="min-h-screen relative overflow-hidden" style={{ 
        backgroundColor: colors.obsidian,
        ...pitchGrid
      }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse_at_top_left, ${colors.electricViolet}10, transparent 40%),
            radial-gradient(ellipse_at_bottom_right, ${colors.royalBlue}08, transparent 35%)
          `
        }} />

        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 
                className="text-4xl font-black mb-4"
                style={{ 
                  fontFamily: typography.family,
                  fontWeight: typography.black,
                  color: colors.white,
                  letterSpacing: "-0.05em"
                }}
              >
                Coach Dashboard
              </h1>
              <p 
                className="text-lg max-w-2xl mx-auto"
                style={{ 
                  fontFamily: typography.family,
                  color: colors.muted,
                  fontSize: typography.body.max
                }}
              >
                Evaluate and track player performance with advanced analytics
              </p>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
            >
              <div 
                className="p-6 text-center rounded-lg"
                style={{ ...glassPanel }}
              >
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.electricViolet }}
                >
                  {stats.totalEvaluations}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: colors.muted }}
                >
                  Total Evaluations
                </div>
              </div>
              <div 
                className="p-6 text-center rounded-lg"
                style={{ ...glassPanel }}
              >
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.warning }}
                >
                  {stats.pending}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: colors.muted }}
                >
                  Pending
                </div>
              </div>
              <div 
                className="p-6 text-center rounded-lg"
                style={{ ...glassPanel }}
              >
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.electricViolet }}
                >
                  {stats.reviewed}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: colors.muted }}
                >
                  Reviewed
                </div>
              </div>
              <div 
                className="p-6 text-center rounded-lg"
                style={{ ...glassPanel }}
              >
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.success }}
                >
                  {stats.approved}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: colors.muted }}
                >
                  Approved
                </div>
              </div>
              <div 
                className="p-6 text-center rounded-lg"
                style={{ ...glassPanel }}
              >
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.electricViolet }}
                >
                  {stats.averageRating}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: colors.muted }}
                >
                  Avg Rating
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex space-x-1 mb-8">
                {["evaluations", "analytics", "reports"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-6 py-3 font-medium transition-all rounded-t-lg"
                    style={{
                      fontFamily: typography.family,
                      fontWeight: typography.medium,
                      color: activeTab === tab ? colors.white : colors.muted,
                      backgroundColor: activeTab === tab ? colors.glass.background : "transparent",
                      border: activeTab === tab ? `1px solid ${colors.glass.border}` : "1px solid transparent",
                      borderBottom: activeTab === tab ? `2px solid ${colors.electricViolet}` : "none"
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div 
                className="min-h-[500px]"
                style={{ ...glassPanel, padding: "24px", borderRadius: borderRadius.large }}
              >
                {activeTab === "evaluations" && (
                  <div>
                    <h3 
                      className="text-xl font-bold mb-6"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      Recent Evaluations
                    </h3>
                    <div className="space-y-4">
                      {evaluations.map((evaluation, index) => {
                        const statusBadge = getStatusBadge(evaluation.status);
                        const radarData = createRadarData(evaluation.criteria);
                        
                        return (
                          <motion.div
                            key={evaluation.playerId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="p-6 rounded-lg cursor-pointer hover:scale-[1.02] transition-transform"
                            style={{ ...glassPanel }}
                            onClick={() => setSelectedEvaluation(evaluation)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 
                                  className="text-lg font-bold"
                                  style={{ 
                                    fontFamily: typography.family,
                                    fontWeight: typography.bold,
                                    color: colors.white
                                  }}
                                >
                                  {evaluation.playerName}
                                </h4>
                                <div className="flex items-center gap-4 text-sm" style={{ color: colors.muted }}>
                                  <span>{evaluation.position}</span>
                                  <span>{evaluation.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="text-2xl font-bold"
                                  style={{ color: colors.electricViolet }}
                                >
                                  {evaluation.overallRating}
                                </div>
                                <div 
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: `${statusBadge.color}20`,
                                    color: statusBadge.color,
                                    fontFamily: typography.family,
                                    fontWeight: typography.medium
                                  }}
                                >
                                  {statusBadge.label}
                                </div>
                              </div>
                            </div>

                            {/* Criteria Bars */}
                            <div className="grid grid-cols-4 gap-4 mb-4">
                              {Object.entries(evaluation.criteria).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div 
                                    className="text-sm font-medium mb-1"
                                    style={{ 
                                      fontFamily: typography.family,
                                      fontWeight: typography.medium,
                                      color: colors.white
                                    }}
                                  >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                  </div>
                                  <div 
                                    className="h-1 rounded-full overflow-hidden mb-1"
                                    style={{ backgroundColor: `${colors.glass.background}` }}
                                  >
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{ 
                                        background: gradient.violet,
                                        width: `${value}%`
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${value}%` }}
                                      transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                                    />
                                  </div>
                                  <div 
                                    className="text-xs font-bold"
                                    style={{ color: colors.electricViolet }}
                                  >
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Notes */}
                            <p 
                              className="text-sm"
                              style={{ 
                                fontFamily: typography.family,
                                color: colors.muted,
                                fontStyle: "italic"
                              }}
                            >
                              "{evaluation.notes}"
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div>
                    <h3 
                      className="text-xl font-bold mb-6"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      Performance Analytics
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Average Criteria */}
                      <div>
                        <h4 
                          className="text-lg font-bold mb-4"
                          style={{ 
                            fontFamily: typography.family,
                            fontWeight: typography.bold,
                            color: colors.white
                          }}
                        >
                          Average Performance by Criteria
                        </h4>
                        <div className="space-y-4">
                          {["technical", "tactical", "physical", "mental"].map((criterion) => {
                            const avgValue = Math.round(
                              evaluations.reduce((sum, e) => sum + e.criteria[criterion as keyof typeof e.criteria], 0) / evaluations.length
                            );
                            
                            return (
                              <div key={criterion} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span 
                                    className="capitalize"
                                    style={{ 
                                      fontFamily: typography.family,
                                      fontWeight: typography.medium,
                                      color: colors.white
                                    }}
                                  >
                                    {criterion}
                                  </span>
                                  <span 
                                    className="font-bold"
                                    style={{ color: colors.electricViolet }}
                                  >
                                    {avgValue}
                                  </span>
                                </div>
                                <div 
                                  className="h-3 rounded-full overflow-hidden"
                                  style={{ backgroundColor: `${colors.glass.background}` }}
                                >
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ 
                                      background: gradient.violet,
                                      width: `${avgValue}%`
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${avgValue}%` }}
                                    transition={{ duration: 0.8 }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rating Distribution */}
                      <div>
                        <h4 
                          className="text-lg font-bold mb-4"
                          style={{ 
                            fontFamily: typography.family,
                            fontWeight: typography.bold,
                            color: colors.white
                          }}
                        >
                          Rating Distribution
                        </h4>
                        <div className="space-y-3">
                          {[80, 85, 90, 95].map((rating) => {
                            const count = evaluations.filter(e => e.overallRating >= rating).length;
                            const percentage = (count / evaluations.length) * 100;
                            
                            return (
                              <div key={rating} className="flex items-center gap-4">
                                <span 
                                  className="w-12 text-sm font-medium"
                                  style={{ 
                                    fontFamily: typography.family,
                                    fontWeight: typography.medium,
                                    color: colors.white
                                  }}
                                >
                                  {rating}+
                                </span>
                                <div 
                                  className="flex-1 h-3 rounded-full overflow-hidden"
                                  style={{ backgroundColor: `${colors.glass.background}` }}
                                >
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ 
                                      background: gradient.violet,
                                      width: `${percentage}%`
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8 }}
                                  />
                                </div>
                                <span 
                                  className="w-12 text-sm font-bold text-right"
                                  style={{ color: colors.electricViolet }}
                                >
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "reports" && (
                  <div>
                    <h3 
                      className="text-xl font-bold mb-6"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      Evaluation Reports
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div 
                        className="p-6 rounded-lg"
                        style={{ ...glassPanel }}
                      >
                        <h4 
                          className="text-lg font-bold mb-4"
                          style={{ 
                            fontFamily: typography.family,
                            fontWeight: typography.bold,
                            color: colors.white
                          }}
                        >
                          Top Performers
                        </h4>
                        <div className="space-y-3">
                          {evaluations
                            .sort((a, b) => b.overallRating - a.overallRating)
                            .slice(0, 3)
                            .map((evaluation, index) => (
                              <div key={evaluation.playerId} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                                    style={{ 
                                      backgroundColor: colors.electricViolet,
                                      color: colors.white
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div 
                                      className="font-medium"
                                      style={{ 
                                        fontFamily: typography.family,
                                        fontWeight: typography.medium,
                                        color: colors.white
                                      }}
                                    >
                                      {evaluation.playerName}
                                    </div>
                                    <div 
                                      className="text-xs"
                                      style={{ color: colors.muted }}
                                    >
                                      {evaluation.position}
                                    </div>
                                  </div>
                                </div>
                                <div 
                                  className="text-lg font-bold"
                                  style={{ color: colors.electricViolet }}
                                >
                                  {evaluation.overallRating}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div 
                        className="p-6 rounded-lg"
                        style={{ ...glassPanel }}
                      >
                        <h4 
                          className="text-lg font-bold mb-4"
                          style={{ 
                            fontFamily: typography.family,
                            fontWeight: typography.bold,
                            color: colors.white
                          }}
                        >
                          Areas for Improvement
                        </h4>
                        <div className="space-y-3">
                          {evaluations
                            .filter(e => e.overallRating < 90)
                            .slice(0, 3)
                            .map((evaluation) => (
                              <div key={evaluation.playerId} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                                    style={{ 
                                      backgroundColor: colors.warning,
                                      color: colors.white
                                    }}
                                    >
                                      !
                                    </div>
                                  <div>
                                    <div 
                                      className="font-medium"
                                      style={{ 
                                        fontFamily: typography.family,
                                        fontWeight: typography.medium,
                                        color: colors.white
                                      }}
                                    >
                                      {evaluation.playerName}
                                    </div>
                                    <div 
                                      className="text-xs"
                                      style={{ color: colors.muted }}
                                    >
                                      {evaluation.position}
                                    </div>
                                  </div>
                                </div>
                                <div 
                                  className="text-lg font-bold"
                                  style={{ color: colors.warning }}
                                >
                                  {evaluation.overallRating}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Evaluation Detail Modal */}
            {selectedEvaluation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
                onClick={() => setSelectedEvaluation(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="max-w-2xl w-full"
                  style={{ ...glassPanel, borderRadius: borderRadius.large }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 
                        className="text-2xl font-bold"
                        style={{ 
                          fontFamily: typography.family,
                          fontWeight: typography.bold,
                          color: colors.white
                        }}
                      >
                        {selectedEvaluation.playerName} - Evaluation
                      </h3>
                      <button
                        onClick={() => setSelectedEvaluation(null)}
                        className="p-2 rounded-lg"
                        style={{ 
                          backgroundColor: colors.glass.background,
                          color: colors.muted
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Radar Chart */}
                    <div className="mb-6">
                      <h4 
                        className="text-lg font-bold mb-4"
                        style={{ 
                          fontFamily: typography.family,
                          fontWeight: typography.bold,
                          color: colors.white
                        }}
                      >
                        Performance Breakdown
                      </h4>
                      <div className="relative w-full aspect-square max-w-sm mx-auto">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Grid circles */}
                          {[20, 40, 60, 80].map((radius) => (
                            <circle
                              key={radius}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={colors.glass.border}
                              strokeWidth="0.5"
                            />
                          ))}
                          
                          {/* Axes */}
                          {createRadarData(selectedEvaluation.criteria).map((_, index) => {
                            const angle = (Math.PI * 2 * index) / 4 - Math.PI / 2;
                            const x2 = 50 + 40 * Math.cos(angle);
                            const y2 = 50 + 40 * Math.sin(angle);
                            return (
                              <line
                                key={index}
                                x1="50"
                                y1="50"
                                x2={x2}
                                y2={y2}
                                stroke={colors.glass.border}
                                strokeWidth="0.5"
                              />
                            );
                          })}
                          
                          {/* Data polygon */}
                          <motion.path
                            d={createRadarPath(createRadarData(selectedEvaluation.criteria))}
                            fill={colors.electricViolet}
                            fillOpacity="0.3"
                            stroke={colors.electricViolet}
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                          />
                          
                          {/* Labels */}
                          {createRadarData(selectedEvaluation.criteria).map((item, index) => {
                            const angle = (Math.PI * 2 * index) / 4 - Math.PI / 2;
                            const x = 50 + 45 * Math.cos(angle);
                            const y = 50 + 45 * Math.sin(angle);
                            return (
                              <text
                                key={index}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="4"
                                fill={colors.white}
                                style={{ fontFamily: typography.family }}
                              >
                                {item.label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    {/* Detailed Criteria */}
                    <div className="space-y-4">
                      {Object.entries(selectedEvaluation.criteria).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span 
                            className="capitalize font-medium"
                            style={{ 
                              fontFamily: typography.family,
                              fontWeight: typography.medium,
                              color: colors.white
                            }}
                          >
                            {key}
                          </span>
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-32 h-2 rounded-full overflow-hidden"
                              style={{ backgroundColor: `${colors.glass.background}` }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{ 
                                  background: gradient.violet,
                                  width: `${value}%`
                                }}
                              />
                            </div>
                            <span 
                              className="font-bold w-8"
                              style={{ color: colors.electricViolet }}
                            >
                              {value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="mt-6">
                      <h4 
                        className="text-lg font-bold mb-3"
                        style={{ 
                          fontFamily: typography.family,
                          fontWeight: typography.bold,
                          color: colors.white
                        }}
                      >
                        Coach Notes
                      </h4>
                      <p 
                        className="text-lg"
                        style={{ 
                          fontFamily: typography.family,
                          color: colors.muted,
                          fontStyle: "italic"
                        }}
                      >
                        "{selectedEvaluation.notes}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
