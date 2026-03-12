"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "@/lib/design/tokens";

interface PlayerProfileProps {
  playerId: string;
}

export default function PlayerProfile({ playerId }: PlayerProfileProps) {
  const [activeTab, setActiveTab] = useState("highlights");

  // Mock data - replace with actual API call
  const player = {
    id: playerId,
    name: "Marcus Rodriguez",
    position: "Central Midfielder",
    age: 21,
    height: "6'2\"",
    weight: "165 lbs",
    nationality: "Spain",
    club: "Real Madrid Academy",
    avatar: "👤",
    verifiedLevel: 3,
    stats: {
      pace: 85,
      shooting: 78,
      passing: 92,
      dribbling: 88,
      defending: 82,
      physical: 79,
      vision: 90,
      technique: 86,
      leadership: 75
    },
    recentMatches: [
      { date: "2024-03-10", opponent: "Barcelona", result: "W 2-1", goals: 1, assists: 1 },
      { date: "2024-03-03", opponent: "Atletico", result: "D 1-1", goals: 0, assists: 1 },
      { date: "2024-02-24", opponent: "Sevilla", result: "W 3-0", goals: 2, assists: 0 },
    ],
    achievements: [
      "Academy Player of the Year 2023",
      "U19 National Team Call-up",
      "Most Assists in Academy League"
    ]
  };

  const radarData = [
    { stat: "Pace", value: player.stats.pace },
    { stat: "Shooting", value: player.stats.shooting },
    { stat: "Passing", value: player.stats.passing },
    { stat: "Dribbling", value: player.stats.dribbling },
    { stat: "Defending", value: player.stats.defending },
    { stat: "Physical", value: player.stats.physical }
  ];

  const createRadarPath = (data: typeof radarData) => {
    const angleStep = (Math.PI * 2) / data.length;
    const points = data.map((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = 50 + (item.value / 100) * 40 * Math.cos(angle);
      const y = 50 + (item.value / 100) * 40 * Math.sin(angle);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")} Z`;
  };

  const getVerificationBadge = (level: number) => {
    const badges = {
      0: { label: "Player", color: colors.muted },
      1: { label: "Verified", color: colors.electricViolet },
      2: { label: "Academy", color: colors.success },
      3: { label: "Pro", color: colors.electricViolet },
      4: { label: "Elite", color: colors.electricViolet },
    };
    return badges[level as keyof typeof badges] || badges[0];
  };

  const verificationBadge = getVerificationBadge(player.verifiedLevel);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      backgroundColor: colors.obsidian,
      ...pitchGrid
    }}>
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse_at_top, ${colors.electricViolet}15, transparent 50%),
            radial-gradient(ellipse_at_bottom, ${colors.royalBlue}10, transparent 50%)
          `
        }} />
        
        <div className="relative px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-center gap-8 mb-12"
            >
              {/* Avatar */}
              <div className="relative">
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center text-6xl"
                  style={{ 
                    ...glassPanel,
                    fontSize: "48px"
                  }}
                >
                  {player.avatar}
                </div>
                <div 
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: verificationBadge.color,
                    color: colors.white
                  }}
                >
                  {verificationBadge.label[0]}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 
                  className="text-4xl font-black mb-2"
                  style={{ 
                    fontFamily: typography.family,
                    fontWeight: typography.black,
                    color: colors.white,
                    letterSpacing: "-0.05em"
                  }}
                >
                  {player.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      ...glassPanel,
                      color: colors.electricViolet,
                      fontFamily: typography.family,
                      fontWeight: typography.semibold
                    }}
                  >
                    {player.position}
                  </span>
                  <span style={{ color: colors.muted }}>
                    Age {player.age}
                  </span>
                  <span style={{ color: colors.muted }}>
                    {player.height} • {player.weight}
                  </span>
                </div>

                <p 
                  className="text-lg mb-4"
                  style={{ 
                    fontFamily: typography.family,
                    color: colors.muted,
                    fontSize: typography.body.max
                  }}
                >
                  {player.club} • {player.nationality}
                </p>

                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto md:mx-0">
                  <div className="text-center">
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: colors.electricViolet }}
                    >
                      {player.recentMatches.reduce((sum, m) => sum + m.goals, 0)}
                    </div>
                    <div className="text-xs" style={{ color: colors.muted }}>Goals</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: colors.electricViolet }}
                    >
                      {player.recentMatches.reduce((sum, m) => sum + m.assists, 0)}
                    </div>
                    <div className="text-xs" style={{ color: colors.muted }}>Assists</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: colors.electricViolet }}
                    >
                      {player.recentMatches.length}
                    </div>
                    <div className="text-xs" style={{ color: colors.muted }}>Matches</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Radar Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-2 gap-8 mb-12"
            >
              {/* Radar Chart */}
              <div 
                className="relative"
                style={{ ...glassPanel, padding: "24px", borderRadius: borderRadius.large }}
              >
                <h3 
                  className="text-xl font-bold mb-6"
                  style={{ 
                    fontFamily: typography.family,
                    fontWeight: typography.bold,
                    color: colors.white
                  }}
                >
                  Performance Analysis
                </h3>
                
                <div className="relative w-full aspect-square">
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
                    {radarData.map((_, index) => {
                      const angle = (Math.PI * 2 * index) / radarData.length - Math.PI / 2;
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
                      d={createRadarPath(radarData)}
                      fill={colors.electricViolet}
                      fillOpacity="0.3"
                      stroke={colors.electricViolet}
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />
                    
                    {/* Labels */}
                    {radarData.map((item, index) => {
                      const angle = (Math.PI * 2 * index) / radarData.length - Math.PI / 2;
                      const x = 50 + 45 * Math.cos(angle);
                      const y = 50 + 45 * Math.sin(angle);
                      return (
                        <text
                          key={index}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="3"
                          fill={colors.white}
                          style={{ fontFamily: typography.family }}
                        >
                          {item.stat}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Detailed Stats */}
              <div 
                className="space-y-4"
                style={{ ...glassPanel, padding: "24px", borderRadius: borderRadius.large }}
              >
                <h3 
                  className="text-xl font-bold mb-6"
                  style={{ 
                    fontFamily: typography.family,
                    fontWeight: typography.bold,
                    color: colors.white
                  }}
                >
                  Key Attributes
                </h3>
                
                {Object.entries(player.stats).slice(0, 6).map(([stat, value]) => (
                  <div key={stat} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span 
                        className="capitalize"
                        style={{ 
                          fontFamily: typography.family,
                          color: colors.white,
                          fontWeight: typography.medium
                        }}
                      >
                        {stat.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span 
                        className="font-bold"
                        style={{ color: colors.electricViolet }}
                      >
                        {value}
                      </span>
                    </div>
                    <div 
                      className="h-2 rounded-full overflow-hidden"
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
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-8">
                {["highlights", "matches", "achievements"].map((tab) => (
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
                className="min-h-[400px]"
                style={{ ...glassPanel, padding: "24px", borderRadius: borderRadius.large }}
              >
                {activeTab === "highlights" && (
                  <div>
                    <h3 
                      className="text-xl font-bold mb-6"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      Recent Highlights
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className="aspect-video rounded-lg"
                          style={{ 
                            backgroundColor: colors.deepNavy,
                            ...glassPanel
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <span style={{ color: colors.muted }}>Video {i}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "matches" && (
                  <div>
                    <h3 
                      className="text-xl font-bold mb-6"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      Recent Matches
                    </h3>
                    <div className="space-y-4">
                      {player.recentMatches.map((match, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg"
                          style={{ ...glassPanel }}
                        >
                          <div>
                            <div 
                              className="font-medium"
                              style={{ 
                                fontFamily: typography.family,
                                fontWeight: typography.medium,
                                color: colors.white
                              }}
                            >
                              vs {match.opponent}
                            </div>
                            <div 
                              className="text-sm"
                              style={{ color: colors.muted }}
                            >
                              {match.date}
                            </div>
                          </div>
                          <div className="text-right">
                            <div 
                              className="font-bold"
                              style={{ color: colors.electricViolet }}
                            >
                              {match.result}
                            </div>
                            <div 
                              className="text-sm"
                              style={{ color: colors.muted }}
                            >
                              {match.goals}G {match.assists}A
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "achievements" && (
                  <div>
                    <h3 
                      className="text-xl font-bold mb-6"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      Achievements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {player.achievements.map((achievement, index) => (
                        <div 
                          key={index}
                          className="p-4 rounded-lg"
                          style={{ ...glassPanel }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏆</span>
                            <div>
                              <div 
                                className="font-medium"
                                style={{ 
                                  fontFamily: typography.family,
                                  fontWeight: typography.medium,
                                  color: colors.white
                                }}
                              >
                                {achievement}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
