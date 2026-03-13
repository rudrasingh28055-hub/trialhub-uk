"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { colors, typography, borderRadius } from "@/lib/design/tokens";

interface Opportunity {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
}

interface HomeClientProps {
  opportunities: Opportunity[];
  user: any;
  role: string | null;
  displayName: string | null;
}

interface Match {
  id: number;
  homeTeam: {
    name: string;
    crest?: string;
  };
  awayTeam: {
    name: string;
    crest?: string;
  };
  score: {
    home: number | null;
    away: number | null;
  };
  minute?: number;
  status?: string;
  utcDate?: string;
  competition?: {
    name: string;
    emblem?: string;
  };
}

interface TransferNews {
  id: number;
  headline: string;
  source: string;
  timeAgo: string;
  club?: string;
  url: string;
}

export default function HomeClient({ opportunities, user, role, displayName }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "transfer">("live");
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [resultsOnly, setResultsOnly] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [transferNews, setTransferNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for caching to avoid rate limits
  const lastFetchTime = useRef(0);
  const cachedLiveData = useRef<Match[]>([]);
  const cachedUpcomingData = useRef<Match[]>([]);

  const heroRef = useRef(null);
  const welcomeRef = useRef(null);
  const footballRef = useRef(null);

  const formatKickoff = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const timeStr = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/London'
    })
    
    if (date.toDateString() === now.toDateString()) {
      return `Today ${timeStr}` 
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${timeStr}`
    } else {
      return date.toLocaleDateString('en-GB', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }) + ` ${timeStr}`
    }
  }

  const timeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    if (h >= 24) return `${Math.floor(h / 24)}d ago`
    if (h >= 1) return `${h}h ago`
    if (m >= 1) return `${m}m ago`
    return 'Just now'
  }

  const fetchLiveScores = async () => {
    // Check cache (55 seconds)
    const now = Date.now();
    if (now - lastFetchTime.current < 55000 && cachedLiveData.current.length > 0) {
      setLiveMatches(cachedLiveData.current);
      return;
    }

    try {
      const res = await fetch('/api/football?type=live');
      const data = await res.json();
      const matches = data.response || [];
      
      // Transform the data to match our interface
      const transformedMatches = matches.map((fixture: any) => ({
        id: fixture.fixture.id,
        homeTeam: { 
          name: fixture.teams.home.name,
          crest: fixture.teams.home.logo 
        },
        awayTeam: { 
          name: fixture.teams.away.name,
          crest: fixture.teams.away.logo 
        },
        score: { 
          home: fixture.goals.home, 
          away: fixture.goals.away 
        },
        minute: fixture.fixture.status.elapsed,
        status: fixture.fixture.status.short,
        utcDate: fixture.fixture.date,
        competition: { 
          name: fixture.league.name,
          emblem: fixture.league.logo 
        }
      }));
      
      // Cache the response
      lastFetchTime.current = now;
      cachedLiveData.current = transformedMatches;
      setLiveMatches(transformedMatches);
      setResultsOnly(!!data.resultsOnly);

      // Auto-switch to upcoming only when truly nothing to show
      if (matches.length === 0 || data.fallback) {
        setActiveTab("upcoming");
      }
      
    } catch (err) {
      console.error("Live scores fetch error:", err);
      setError("Live scores temporarily unavailable");
    }
  };

  const fetchUpcomingMatches = async () => {
    // Check cache (55 seconds)
    const now = Date.now();
    if (now - lastFetchTime.current < 55000 && cachedUpcomingData.current.length > 0) {
      setUpcomingMatches(cachedUpcomingData.current);
      return;
    }

    try {
      const res = await fetch('/api/football?type=upcoming');
      const data = await res.json();
      const matches = data.response || [];
      
      // Sort by fixture date ascending and take max 6
      const sortedMatches = matches
        .sort((a: any, b: any) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .slice(0, 6);
      
      // Transform the data to match our interface
      const transformedMatches = sortedMatches.map((fixture: any) => ({
        id: fixture.fixture.id,
        homeTeam: { 
          name: fixture.teams.home.name,
          crest: fixture.teams.home.logo 
        },
        awayTeam: { 
          name: fixture.teams.away.name,
          crest: fixture.teams.away.logo 
        },
        score: { 
          home: fixture.goals.home, 
          away: fixture.goals.away 
        },
        minute: fixture.fixture.status.elapsed,
        status: fixture.fixture.status.short,
        utcDate: fixture.fixture.date,
        competition: { 
          name: fixture.league.name,
          emblem: fixture.league.logo 
        }
      }));
      
      // Cache the response
      lastFetchTime.current = now;
      cachedUpcomingData.current = transformedMatches;
      setUpcomingMatches(transformedMatches);
      
    } catch (err) {
      console.error("Upcoming matches fetch error:", err);
      setError("Check back soon for upcoming fixtures");
    }
  };

  const fetchTransferNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      const articles = data.articles || [];
      setTransferNews(articles);
      
    } catch (err) {
      console.error("Transfer news fetch error:", err);
      // Show placeholder message if API fails
      setTransferNews([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchLiveScores(),
        fetchUpcomingMatches(),
        fetchTransferNews()
      ]);
      
      setLoading(false);
    };

    loadData();
    
    // Auto-refresh live scores every 60 seconds
    const interval = setInterval(fetchLiveScores, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div
      className={className}
      style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        borderRadius: "20px"
      }}
    >
      {children}
    </div>
  );

  return (
    <AppLayout>
      <div className="relative overflow-hidden" style={{ background: "#0B0B0F" }}>

        {/* HERO SECTION */}
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative min-h-screen flex items-center justify-center px-6"
          style={{
            paddingTop: "96px",
            paddingBottom: "96px",
            background: "radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)"
          }}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white mb-6"
              style={{
                fontSize: "96px",
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 900,
                letterSpacing: "-0.04em"
              }}
            >
              DEBUT
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-10 mx-auto"
              style={{
                fontSize: "18px",
                maxWidth: "480px",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0"
              }}
            >
              Where football talent gets discovered
            </motion.p>

            {/* Stat strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex justify-center items-center mb-12 mx-auto"
              style={{ maxWidth: "480px" }}
            >
              {[
                { number: "2,400+", label: "Athletes" },
                { number: "180+", label: "Clubs" },
                { number: "45", label: "Countries" }
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  {i > 0 && (
                    <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.1)", margin: "0 24px" }} />
                  )}
                  <div className="text-center">
                    <div style={{ fontSize: "20px", fontFamily: "'Satoshi', sans-serif", fontWeight: 700, color: "#F8FAFC" }}>
                      {stat.number}
                    </div>
                    <div style={{ fontSize: "12px", fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)" }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 0 32px rgba(124, 58, 237, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-150 ease hover:translate-y-[-1px] hover:brightness-110 active:translate-y-0 active:scale-98"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                    borderRadius: "999px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                    fontFamily: "'Satoshi', sans-serif",
                    fontWeight: 700
                  }}
                >
                  Get Started
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/feed"
                  className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-150 ease hover:translate-y-[-1px] hover:border-opacity-50 hover:bg-opacity-5 active:translate-y-0 active:scale-98 border"
                  style={{
                    borderColor: "rgba(255,255,255,0.2)",
                    borderRadius: "999px",
                    background: "transparent",
                    fontFamily: "'Satoshi', sans-serif",
                    fontWeight: 700
                  }}
                >
                  Explore Feed
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* PERSONALIZED WELCOME SECTION */}
        {user && (
          <motion.section
            ref={welcomeRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative px-6"
            style={{ paddingTop: "64px", paddingBottom: "64px" }}
          >
            <div className="max-w-2xl mx-auto">
              <div
                style={{
                  background: "#111118",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  padding: "28px",
                  textAlign: "center"
                }}
              >
                <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Satoshi', sans-serif", letterSpacing: "-0.02em" }}>
                  Welcome back, <span style={{ color: "#7C3AED" }}>{displayName || user.email}</span>
                </h2>

                {role && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full mb-6" style={{ background: "rgba(124,58,237,0.2)" }}>
                    <span className="text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                      {role === "athlete" ? "ATHLETE" : role === "scout" ? "SCOUT" : role === "coach" ? "COACH" : role?.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>12</div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}>Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>1.2K</div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}>Profile Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>8</div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}>Scout Interest</div>
                  </div>
                </div>

                <Link
                  href="/feed"
                  className="inline-flex items-center text-white font-medium transition-all duration-150 ease hover:translate-y-[-1px] active:translate-y-0"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  Continue →
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* WHAT'S HAPPENING SECTION */}
        <motion.section 
          ref={footballRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative px-6"
          style={{ paddingTop: "96px", paddingBottom: "96px" }}
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white text-center mb-12"
              style={{ fontSize: "clamp(32px,5vw,56px)", fontFamily: "'Satoshi', sans-serif", fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.55))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              What's Happening
            </motion.h2>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div
                className="inline-flex p-1"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  padding: "4px"
                }}
              >
                {[
                  { key: "live", label: "LIVE SCORES" },
                  { key: "upcoming", label: "UPCOMING" },
                  { key: "transfer", label: "TRANSFER NEWS" }
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-2 text-sm font-medium transition-all duration-150 ease hover:opacity-100 ${
                      activeTab === tab.key ? "text-white" : "text-gray-400"
                    }`}
                    style={{
                      background: activeTab === tab.key ? "#7C3AED" : "transparent",
                      borderRadius: "8px",
                      fontFamily: "'Satoshi', sans-serif",
                      fontWeight: 700,
                      opacity: activeTab === tab.key ? 1 : 0.6
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <GlassCard className="min-h-[400px]">
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse rounded-lg h-20" style={{ background: "rgba(255,255,255,0.05)" }} />
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <p>Unable to load data. Please try again later.</p>
                </div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "live" && (
                    <div className="p-6">
                      {liveMatches.length === 0 ? (
                        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <p className="text-lg mb-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>No live matches right now</p>
                          <p className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Check upcoming matches for fixtures</p>
                        </div>
                      ) : (
                        <>
                          {resultsOnly && (
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                              Today&apos;s Results
                            </p>
                          )}
                          <div className="space-y-4">
                            {liveMatches.map((match) => {
                              const isLive = match.status === "1H" || match.status === "2H" || match.status === "ET" || match.status === "P";
                              const isFinished = match.status === "FT";

                              return (
                                <div key={match.id} className="p-4 transition-all duration-200 ease hover:translate-y-[-2px]" style={{
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: "12px"
                                }}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      {match.homeTeam.crest && (
                                        <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-6 h-6" />
                                      )}
                                      <p className="font-medium flex-1" style={{ fontFamily: "'Satoshi', sans-serif", color: "white" }}>{match.homeTeam.name}</p>
                                    </div>

                                    <div className="text-center px-4">
                                      <div className="flex items-center gap-2 justify-center">
                                        {isLive && (
                                          <span style={{
                                            display: 'inline-block', width: 6, height: 6,
                                            borderRadius: '50%', background: '#EF4444',
                                            animation: 'pulse 1.5s ease-in-out infinite'
                                          }} />
                                        )}
                                        <div className="font-bold" style={{ fontSize: "28px", fontFamily: "'Satoshi', sans-serif", color: "white" }}>
                                          {(isLive || isFinished) && match.score.home !== null
                                            ? `${match.score.home} - ${match.score.away}`
                                            : "vs"}
                                        </div>
                                      </div>
                                      <div className="text-sm mt-1" style={{
                                        color: isLive ? "#EF4444" : "rgba(255,255,255,0.5)",
                                        fontFamily: "Inter, sans-serif", fontSize: "11px"
                                      }}>
                                        {isLive && match.minute ? `${match.minute}' LIVE` : isFinished ? "FT" : ""}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-1 justify-end">
                                      <p className="font-medium flex-1 text-right" style={{ fontFamily: "'Satoshi', sans-serif", color: "white" }}>{match.awayTeam.name}</p>
                                      {match.awayTeam.crest && (
                                        <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-6 h-6" />
                                      )}
                                    </div>
                                  </div>

                                  {match.competition && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                      {match.competition.emblem && (
                                        <img src={match.competition.emblem} alt={match.competition.name} className="w-4 h-4" />
                                      )}
                                      <span style={{
                                        color: "rgba(124,58,237,0.6)", fontSize: "11px",
                                        fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em"
                                      }}>
                                        {match.competition.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "upcoming" && (
                    <div className="p-6">
                      <div className="space-y-4">
                        {upcomingMatches.length === 0 ? (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '32px', 
                            color: 'rgba(255,255,255,0.4)' 
                          }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                            <p>No upcoming fixtures this week</p>
                            <p style={{ fontSize: 12, marginTop: 4 }}>
                              Check back before matchday
                            </p>
                          </div>
                        ) : (
                          upcomingMatches.map((match) => (
                            <div key={match.id} className="p-4 transition-all duration-200 ease hover:translate-y-[-2px]" style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "12px"
                            }}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {match.homeTeam.crest && (
                                    <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-6 h-6" />
                                  )}
                                  <span className="font-medium" style={{ fontFamily: "'Satoshi', sans-serif", color: "white" }}>
                                    {match.homeTeam.name}
                                  </span>
                                </div>
                                
                                <span style={{ fontFamily: "'Satoshi', sans-serif", color: "rgba(255,255,255,0.8)" }}>
                                  vs
                                </span>
                                
                                <div className="flex items-center gap-2">
                                  <span className="font-medium" style={{ fontFamily: "'Satoshi', sans-serif", color: "white" }}>
                                    {match.awayTeam.name}
                                  </span>
                                  {match.awayTeam.crest && (
                                    <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-6 h-6" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                {match.competition && (
                                  <span style={{ 
                                    color: "rgba(124,58,237,0.6)", 
                                    fontSize: "11px", 
                                    fontFamily: "Inter, sans-serif",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                  }}>
                                    {match.competition.name}
                                  </span>
                                )}
                                
                                <span style={{ 
                                  fontFamily: "'Satoshi', sans-serif", 
                                  color: "white",
                                  fontSize: "14px"
                                }}>
                                  {match.utcDate ? formatKickoff(match.utcDate) : 'Time TBD'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "transfer" && (
                    <div>
                      {transferNews.length === 0 ? (
                        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, marginBottom: 8 }}>No news available</p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>Add NEWS_API_KEY to .env.local</p>
                        </div>
                      ) : (
                        <div>
                          {transferNews.map((article, i) => (
                            <div key={article.url}>
                              <div
                                role="link"
                                tabIndex={0}
                                onClick={() => window.open(article.url, '_blank')}
                                onKeyDown={(e) => e.key === 'Enter' && window.open(article.url, '_blank')}
                                style={{ display: 'flex', gap: 16, padding: '16px 20px', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                {/* Thumbnail */}
                                {article.urlToImage && (
                                  <div style={{ flexShrink: 0, width: 88, height: 66, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                                    <img
                                      src={article.urlToImage}
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                  </div>
                                )}
                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{
                                    color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif",
                                    fontWeight: 700, fontSize: 14, lineHeight: 1.45,
                                    marginBottom: 8, display: '-webkit-box',
                                    WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                  }}>
                                    {article.title}
                                  </p>
                                  <p style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                                    {article.source?.name}
                                    <span style={{ margin: '0 6px' }}>·</span>
                                    {timeAgo(article.publishedAt)}
                                  </p>
                                </div>
                              </div>
                              {i < transferNews.length - 1 && (
                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </GlassCard>
          </div>
        </motion.section>

        {/* CALL TO ACTION SECTION */}
        {!user && (
          <section
            style={{
              padding: "120px 24px",
              textAlign: "center",
              borderTop: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <h2
              style={{
                fontSize: "48px",
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 800,
                color: "#F8FAFC",
                letterSpacing: "-0.03em",
                marginBottom: "16px"
              }}
            >
              Ready to make your debut?
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "16px",
                fontFamily: "Inter, sans-serif",
                maxWidth: "440px",
                margin: "0 auto 40px"
              }}
            >
              Join thousands of athletes and clubs already on the platform.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-150 ease hover:brightness-110"
              style={{
                background: "#7C3AED",
                borderRadius: "999px",
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 700
              }}
            >
              Get started free →
            </Link>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
