"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "../../lib/design/tokens";

interface PlayerCard {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  club: string;
  rating: number;
  avatar: string;
  verifiedLevel: number;
  stats: {
    goals: number;
    assists: number;
    matches: number;
  };
}

export default function ScoutDiscovery() {
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedAge, setSelectedAge] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const positions = ["all", "forward", "midfielder", "defender", "goalkeeper"];
  const ageRanges = ["all", "16-18", "18-20", "20-22", "22-25", "25+"];
  const ratingRanges = ["all", "80+", "85+", "90+", "95+"];

  // Mock data - replace with actual API call
  const players: PlayerCard[] = [
    {
      id: "1",
      name: "Carlos Silva",
      position: "Forward",
      age: 19,
      nationality: "Brazil",
      club: "Santos FC",
      rating: 92,
      avatar: "⚽",
      verifiedLevel: 3,
      stats: { goals: 24, assists: 12, matches: 35 }
    },
    {
      id: "2", 
      name: "Marco Rossi",
      position: "Midfielder",
      age: 21,
      nationality: "Italy",
      club: "AC Milan",
      rating: 88,
      avatar: "🎯",
      verifiedLevel: 2,
      stats: { goals: 8, assists: 18, matches: 42 }
    },
    {
      id: "3",
      name: "James Wilson",
      position: "Defender",
      age: 20,
      nationality: "England",
      club: "Manchester United",
      rating: 85,
      avatar: "🛡️",
      verifiedLevel: 2,
      stats: { goals: 3, assists: 5, matches: 38 }
    },
    {
      id: "4",
      name: "Lucas Martinez",
      position: "Forward",
      age: 18,
      nationality: "Argentina",
      club: "River Plate",
      rating: 94,
      avatar: "⚡",
      verifiedLevel: 4,
      stats: { goals: 31, assists: 9, matches: 28 }
    }
  ];

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

  const filteredPlayers = players.filter(player => {
    const matchesPosition = selectedPosition === "all" || player.position.toLowerCase().includes(selectedPosition);
    const matchesAge = selectedAge === "all" || 
      (selectedAge === "16-18" && player.age >= 16 && player.age <= 18) ||
      (selectedAge === "18-20" && player.age >= 18 && player.age <= 20) ||
      (selectedAge === "20-22" && player.age >= 20 && player.age <= 22) ||
      (selectedAge === "22-25" && player.age >= 22 && player.age <= 25) ||
      (selectedAge === "25+" && player.age >= 25);
    const matchesRating = selectedRating === "all" ||
      (selectedRating === "80+" && player.rating >= 80) ||
      (selectedRating === "85+" && player.rating >= 85) ||
      (selectedRating === "90+" && player.rating >= 90) ||
      (selectedRating === "95+" && player.rating >= 95);
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.club.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPosition && matchesAge && matchesRating && matchesSearch;
  });

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
                Scout Discovery
              </h1>
              <p 
                className="text-lg max-w-2xl mx-auto"
                style={{ 
                  fontFamily: typography.family,
                  color: colors.muted,
                  fontSize: typography.body.max
                }}
              >
                Discover and evaluate the next generation of football talent
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div 
                className="relative max-w-2xl mx-auto"
                style={{ ...glassPanel, borderRadius: borderRadius.pill }}
              >
                <input
                  type="text"
                  placeholder="Search players, clubs, or nationalities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-transparent border-0 outline-none text-white placeholder-gray-500"
                  style={{ 
                    fontFamily: typography.family,
                    fontSize: typography.body.max
                  }}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="h-5 w-5" style={{ color: colors.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Position Filter */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-3"
                    style={{ 
                      fontFamily: typography.family,
                      fontWeight: typography.medium,
                      color: colors.white
                    }}
                  >
                    Position
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {positions.map((position) => (
                      <button
                        key={position}
                        onClick={() => setSelectedPosition(position)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                        style={{
                          fontFamily: typography.family,
                          fontWeight: typography.medium,
                          backgroundColor: selectedPosition === position ? colors.electricViolet : colors.glass.background,
                          color: selectedPosition === position ? colors.white : colors.muted,
                          border: selectedPosition === position ? "none" : `1px solid ${colors.glass.border}`
                        }}
                      >
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Filter */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-3"
                    style={{ 
                      fontFamily: typography.family,
                      fontWeight: typography.medium,
                      color: colors.white
                    }}
                  >
                    Age Range
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ageRanges.map((age) => (
                      <button
                        key={age}
                        onClick={() => setSelectedAge(age)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                        style={{
                          fontFamily: typography.family,
                          fontWeight: typography.medium,
                          backgroundColor: selectedAge === age ? colors.electricViolet : colors.glass.background,
                          color: selectedAge === age ? colors.white : colors.muted,
                          border: selectedAge === age ? "none" : `1px solid ${colors.glass.border}`
                        }}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-3"
                    style={{ 
                      fontFamily: typography.family,
                      fontWeight: typography.medium,
                      color: colors.white
                    }}
                  >
                    Minimum Rating
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ratingRanges.map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(rating)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                        style={{
                          fontFamily: typography.family,
                          fontWeight: typography.medium,
                          backgroundColor: selectedRating === rating ? colors.electricViolet : colors.glass.background,
                          color: selectedRating === rating ? colors.white : colors.muted,
                          border: selectedRating === rating ? "none" : `1px solid ${colors.glass.border}`
                        }}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Player Cards Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPlayers.map((player, index) => {
                const verificationBadge = getVerificationBadge(player.verifiedLevel);
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -4 }}
                    className="cursor-pointer"
                    style={{ ...glassPanel, borderRadius: borderRadius.large }}
                  >
                    {/* Player Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={{ 
                              backgroundColor: colors.electricViolet,
                              color: colors.white
                            }}
                          >
                            {player.avatar}
                          </div>
                          <div>
                            <h3 
                              className="font-bold text-lg"
                              style={{ 
                                fontFamily: typography.family,
                                fontWeight: typography.bold,
                                color: colors.white
                              }}
                            >
                              {player.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-xs px-2 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: `${colors.electricViolet}20`,
                                  color: colors.electricViolet,
                                  fontFamily: typography.family,
                                  fontWeight: typography.medium
                                }}
                              >
                                {player.position}
                              </span>
                              <span 
                                className="text-xs"
                                style={{ color: colors.muted }}
                              >
                                Age {player.age}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: verificationBadge.color,
                            color: colors.white
                          }}
                        >
                          {verificationBadge.label[0]}
                        </div>
                      </div>

                      {/* Club and Nationality */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <span style={{ color: colors.muted }}>🏢</span>
                          <span 
                            className="text-sm"
                            style={{ 
                              fontFamily: typography.family,
                              color: colors.white
                            }}
                          >
                            {player.club}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: colors.muted }}>🌍</span>
                          <span 
                            className="text-sm"
                            style={{ 
                              fontFamily: typography.family,
                              color: colors.white
                            }}
                          >
                            {player.nationality}
                          </span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            className="text-sm font-medium"
                            style={{ 
                              fontFamily: typography.family,
                              fontWeight: typography.medium,
                              color: colors.white
                            }}
                          >
                            Overall Rating
                          </span>
                          <span 
                            className="text-2xl font-bold"
                            style={{ 
                              fontFamily: typography.family,
                              fontWeight: typography.black,
                              color: colors.electricViolet
                            }}
                          >
                            {player.rating}
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
                              width: `${player.rating}%`
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${player.rating}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div 
                            className="text-lg font-bold"
                            style={{ color: colors.electricViolet }}
                          >
                            {player.stats.goals}
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: colors.muted }}
                          >
                            Goals
                          </div>
                        </div>
                        <div>
                          <div 
                            className="text-lg font-bold"
                            style={{ color: colors.electricViolet }}
                          >
                            {player.stats.assists}
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: colors.muted }}
                          >
                            Assists
                          </div>
                        </div>
                        <div>
                          <div 
                            className="text-lg font-bold"
                            style={{ color: colors.electricViolet }}
                          >
                            {player.stats.matches}
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: colors.muted }}
                          >
                            Matches
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div 
                      className="px-6 py-4 border-t"
                      style={{ borderColor: colors.glass.border }}
                    >
                      <button 
                        className="w-full py-3 font-medium rounded-lg transition-all"
                        style={{
                          fontFamily: typography.family,
                          fontWeight: typography.medium,
                          background: gradient.violet,
                          color: colors.white,
                          border: "none",
                          borderRadius: borderRadius.small
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Full Profile
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
