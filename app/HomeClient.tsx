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
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "transfer" | "standings">("live");
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [resultsOnly, setResultsOnly] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [transferNews, setTransferNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLeague, setStandingsLeague] = useState('eng.1');
  const [standingsLoading, setStandingsLoading] = useState(false);
  // Map of team name -> points for win probability calculation
  const standingsMap = useRef<Map<string, number>>(new Map());

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

      // Only auto-switch when there truly are no live games AND no today's results
      if (data.fallback) {
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

  const fetchStandings = async (league: string) => {
    setStandingsLoading(true);
    try {
      const res = await fetch(`/api/standings?league=${league}`);
      const data = await res.json();
      const rows = data.standings ?? [];
      setStandings(rows);
      // Rebuild points map for probability calc (covers all fetched leagues)
      rows.forEach((r: any) => standingsMap.current.set(r.team.name, r.pts));
    } catch {
      setStandings([]);
    } finally {
      setStandingsLoading(false);
    }
  };

  // Win probability from points; falls back to near-equal if team not found
  const winProb = (homeName: string, awayName: string) => {
    const hPts = standingsMap.current.get(homeName) ?? 45;
    const aPts = standingsMap.current.get(awayName) ?? 45;
    const hStr = hPts * 1.3; // home advantage
    const total = hStr + aPts;
    const draw = 22;
    const home = Math.round((hStr / total) * (100 - draw));
    const away = 100 - draw - home;
    return { home, draw, away };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchLiveScores(),
        fetchUpcomingMatches(),
        fetchTransferNews(),
        fetchStandings('eng.1'), // pre-load PL for probability bars
      ]);
      setLoading(false);
    };
    loadData();
    const interval = setInterval(fetchLiveScores, 60000);
    return () => clearInterval(interval);
  }, []);

  // Team crest with initial fallback
  const TeamCrest = ({ src, name }: { src?: string; name: string }) => {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    if (src) {
      return (
        <img
          src={src} alt={name}
          style={{ width: 40, height: 40, objectFit: 'contain' }}
          onError={e => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
            if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'
          }}
        />
      )
    }
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(124,58,237,0.2)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700,
        fontFamily: "'Satoshi', sans-serif"
      }}>{initials}</div>
    )
  }

  // Shared Google-style match card
  const MatchCard = ({ match, showTime = false }: { match: Match; showTime?: boolean }) => {
    const isLive = match.status === "1H" || match.status === "2H" || match.status === "ET" || match.status === "P"
    const isFinished = match.status === "FT"
    const hasScore = (isLive || isFinished) && match.score.home !== null

    const kickoffTime = match.utcDate
      ? new Date(match.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
      : 'TBD'

    const competitionLabel = match.competition?.name ?? ''
    const statusLabel = isLive
      ? (match.minute ? `${match.minute}'` : 'Live')
      : isFinished ? 'Full-time'
      : match.utcDate ? formatKickoff(match.utcDate) : 'TBD'

    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: '16px 20px 18px',
        userSelect: 'none'
      }}>
        {/* Competition + status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {match.competition?.emblem && (
              <img src={match.competition.emblem} alt="" style={{ width: 14, height: 14, objectFit: 'contain', opacity: 0.7 }} />
            )}
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 500, letterSpacing: '0.03em' }}>
              {competitionLabel}
            </span>
          </div>
          {/* Status badge */}
          {isLive ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#EF4444', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
              {match.minute ? `${match.minute}' LIVE` : 'LIVE'}
            </span>
          ) : isFinished ? (
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Full-time</span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{kickoffTime}</span>
          )}
        </div>

        {/* Teams + score row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
          {/* Home team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <TeamCrest src={match.homeTeam.crest} name={match.homeTeam.name} />
            <span style={{
              color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 600,
              fontSize: 12, textAlign: 'center', lineHeight: 1.3,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>{match.homeTeam.name}</span>
          </div>

          {/* Score / time */}
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            {hasScore ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 900, fontSize: 36, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {match.score.home}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'Satoshi', sans-serif", fontWeight: 400, fontSize: 24 }}>–</span>
                <span style={{ color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 900, fontSize: 36, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {match.score.away}
                </span>
              </div>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
                {kickoffTime}
              </span>
            )}
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <TeamCrest src={match.awayTeam.crest} name={match.awayTeam.name} />
            <span style={{
              color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 600,
              fontSize: 12, textAlign: 'center', lineHeight: 1.3,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>{match.awayTeam.name}</span>
          </div>
        </div>

        {/* Win probability bar — only for upcoming */}
        {showTime && !hasScore && (() => {
          const prob = winProb(match.homeTeam.name, match.awayTeam.name)
          return (
            <div style={{ marginTop: 14 }}>
              {/* Bar */}
              <div style={{ display: 'flex', height: 4, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
                <div style={{ width: `${prob.home}%`, background: '#7C3AED', borderRadius: '99px 0 0 99px' }} />
                <div style={{ width: `${prob.draw}%`, background: 'rgba(255,255,255,0.18)' }} />
                <div style={{ width: `${prob.away}%`, background: '#2563EB', borderRadius: '0 99px 99px 0' }} />
              </div>
              {/* Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: '#A78BFA', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{prob.home}%</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Draw {prob.draw}%</span>
                <span style={{ color: '#60A5FA', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{prob.away}%</span>
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

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
          className="relative flex items-center justify-center px-6"
          style={{
            paddingTop: "80px",
            paddingBottom: "64px",
            background: "radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)"
          }}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white mb-4"
              style={{
                fontSize: "clamp(64px, 12vw, 96px)",
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
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-2 mx-auto"
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                maxWidth: "520px",
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 700,
                letterSpacing: "-0.01em"
              }}
            >
              Built for players who deserve to be seen
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8 mx-auto"
              style={{
                fontSize: "15px",
                maxWidth: "400px",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Where football talent gets discovered
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 0 32px rgba(124, 58, 237, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-150 ease hover:translate-y-[-1px] hover:brightness-110 active:translate-y-0"
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
                  className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-150 ease hover:translate-y-[-1px] active:translate-y-0 border"
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

            {/* Feature icons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              {[
                { icon: "⚡", label: "AI Spotlight Detection" },
                { icon: "🎥", label: "Highlight Reels" },
                { icon: "🔍", label: "Scout Discovery" },
              ].map((feat) => (
                <div
                  key={feat.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 18px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 999,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{feat.icon}</span>
                  <span style={{ fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>{feat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* HOW IT WORKS */}
        <section className="relative px-6" style={{ paddingTop: "64px", paddingBottom: "56px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="max-w-4xl mx-auto text-center">
            <p style={{ fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.14em", color: "#7C3AED", textTransform: "uppercase", marginBottom: 16 }}>
              The process
            </p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontFamily: "'Satoshi', sans-serif", fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.03em", marginBottom: 56 }}>
              How it works
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2, position: "relative" }}>
              {[
                { step: "01", title: "Upload Your Highlight", desc: "Record a goal, assist, or training clip. Upload in seconds with our AI-powered editor.", icon: "🎬" },
                { step: "02", title: "Get Discovered", desc: "Your highlight reaches scouts and clubs across 45 countries actively searching for talent.", icon: "🌍" },
                { step: "03", title: "Sign Your Contract", desc: "Connect directly with clubs, negotiate terms, and take the next step in your career.", icon: "✍️" },
              ].map((item, i) => (
                <div key={item.step} style={{ position: "relative", padding: "36px 28px", background: i === 1 ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid", borderColor: i === 1 ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.07)", borderRadius: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 700, color: "#7C3AED", letterSpacing: "0.1em", marginBottom: 10 }}>{item.step}</div>
                  <h3 style={{ fontSize: 18, fontFamily: "'Satoshi', sans-serif", fontWeight: 800, color: "#F8FAFC", marginBottom: 10, letterSpacing: "-0.02em" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{item.desc}</p>
                  {i < 2 && (
                    <div style={{ position: "absolute", top: "50%", right: -14, transform: "translateY(-50%)", fontSize: 18, color: "rgba(255,255,255,0.15)", zIndex: 1, display: "none" }} className="md:block">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOR SCOUTS vs FOR ATHLETES */}
        <section className="relative px-6" style={{ paddingBottom: "96px" }}>
          <div className="max-w-4xl mx-auto">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* For Athletes */}
              <div style={{ padding: "36px 32px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🏃</div>
                <h3 style={{ fontSize: 22, fontFamily: "'Satoshi', sans-serif", fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.02em", marginBottom: 8 }}>For Athletes</h3>
                <p style={{ fontSize: 14, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 24 }}>
                  Stop sending cold emails. Upload your highlights and let your talent speak directly to the clubs that matter.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {["AI-powered best moment detection", "Scout view analytics & insights", "Direct club messaging", "Verified athlete badge"].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: "#7C3AED", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", marginTop: 28, padding: "10px 22px", background: "linear-gradient(135deg,#7C3AED,#2563EB)", borderRadius: 999, fontSize: 14, fontFamily: "'Satoshi', sans-serif", fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                  Join as Athlete →
                </Link>
              </div>

              {/* For Scouts */}
              <div style={{ padding: "36px 32px", background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🔭</div>
                <h3 style={{ fontSize: 22, fontFamily: "'Satoshi', sans-serif", fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.02em", marginBottom: 8 }}>For Scouts & Clubs</h3>
                <p style={{ fontSize: 14, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 24 }}>
                  Discover verified talent from 45 countries without leaving your desk. Filter by position, age, and skill.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Advanced position & skill filters", "Full highlight reel access", "Save & shortlist players", "Direct athlete contact"].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: "#2563EB", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", marginTop: 28, padding: "10px 22px", background: "linear-gradient(135deg,#2563EB,#1E40AF)", borderRadius: 999, fontSize: 14, fontFamily: "'Satoshi', sans-serif", fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                  Join as Scout →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PERSONALIZED WELCOME SECTION */}
        {user && (
          <motion.section
            ref={welcomeRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative px-6"
            style={{ paddingTop: "40px", paddingBottom: "40px" }}
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
          style={{ paddingTop: "48px", paddingBottom: "80px" }}
        >
          <div className="max-w-7xl mx-auto">
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
                  { key: "transfer", label: "TRANSFER NEWS" },
                  { key: "standings", label: "STANDINGS" },
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
                    <div style={{ padding: '16px 12px' }}>
                      {liveMatches.length === 0 ? (
                        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, marginBottom: 6 }}>No live matches right now</p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>Check the Upcoming tab for fixtures</p>
                        </div>
                      ) : (
                        <>
                          {resultsOnly && (
                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, paddingLeft: 8 }}>
                              Today&apos;s Results
                            </p>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                            {liveMatches.map(match => <MatchCard key={match.id} match={match} />)}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "upcoming" && (
                    <div style={{ padding: '16px 12px' }}>
                      {upcomingMatches.length === 0 ? (
                        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, marginBottom: 6 }}>No upcoming fixtures</p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>Check back before matchday</p>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                          {upcomingMatches.map(match => <MatchCard key={match.id} match={match} showTime />)}
                        </div>
                      )}
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
                            <div key={`${article.link || article.url || i}-${i}`}>
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
                  {activeTab === "standings" && (
                    <div style={{ padding: '16px 0 8px' }}>
                      {/* League selector */}
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>
                        {[
                          { slug: 'eng.1', label: 'Premier League' },
                          { slug: 'esp.1', label: 'La Liga' },
                          { slug: 'ger.1', label: 'Bundesliga' },
                          { slug: 'ita.1', label: 'Serie A' },
                          { slug: 'fra.1', label: 'Ligue 1' },
                        ].map(l => (
                          <button
                            key={l.slug}
                            onClick={() => {
                              setStandingsLeague(l.slug);
                              fetchStandings(l.slug);
                            }}
                            style={{
                              flexShrink: 0, padding: '5px 14px', borderRadius: 99, fontSize: 12,
                              fontFamily: 'Inter, sans-serif', fontWeight: 600, border: 'none',
                              cursor: 'pointer', whiteSpace: 'nowrap',
                              background: standingsLeague === l.slug ? '#7C3AED' : 'rgba(255,255,255,0.07)',
                              color: standingsLeague === l.slug ? '#fff' : 'rgba(255,255,255,0.5)',
                              transition: 'all 0.15s'
                            }}
                          >{l.label}</button>
                        ))}
                      </div>

                      {/* Table */}
                      {standingsLoading ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                          Loading…
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                {['#', 'Club', 'MP', 'W', 'D', 'L', 'GD', 'Pts'].map((h, i) => (
                                  <th key={h} style={{
                                    padding: '8px 12px', color: 'rgba(255,255,255,0.35)', fontWeight: 600,
                                    textAlign: i <= 1 ? 'left' : 'center', whiteSpace: 'nowrap'
                                  }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((row, i) => {
                                const pos = row.pos;
                                const zoneColor =
                                  pos <= 4 ? 'rgba(37,99,235,0.55)'   // Champions League
                                  : pos <= 6 ? 'rgba(234,88,12,0.55)'  // Europa
                                  : pos >= standings.length - 2 ? 'rgba(239,68,68,0.55)' // Relegation
                                  : 'transparent';
                                const isHighlighted = pos <= 6 || pos >= standings.length - 2;
                                return (
                                  <tr
                                    key={row.team.name}
                                    style={{
                                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                    }}
                                  >
                                    <td style={{ padding: '10px 12px', textAlign: 'left' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 3, height: 20, borderRadius: 99, background: zoneColor, flexShrink: 0 }} />
                                        <span style={{ color: isHighlighted ? '#F8FAFC' : 'rgba(255,255,255,0.45)', fontWeight: 700, fontSize: 12, minWidth: 16, textAlign: 'center' }}>{pos}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {row.team.logo ? (
                                          <img src={row.team.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                        ) : (
                                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white' }}>
                                            {row.team.shortName?.slice(0, 2)}
                                          </div>
                                        )}
                                        <span style={{ color: '#F8FAFC', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                                          {row.team.name}
                                        </span>
                                      </div>
                                    </td>
                                    {[row.mp, row.w, row.d, row.l].map((v, j) => (
                                      <td key={j} style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{v}</td>
                                    ))}
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: row.gd > 0 ? '#6EE7B7' : row.gd < 0 ? '#FCA5A5' : 'rgba(255,255,255,0.5)' }}>
                                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#F8FAFC', fontWeight: 700 }}>{row.pts}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Legend */}
                          <div style={{ display: 'flex', gap: 16, padding: '12px 16px', flexWrap: 'wrap' }}>
                            {[
                              { color: 'rgba(37,99,235,0.7)', label: 'Champions League' },
                              { color: 'rgba(234,88,12,0.7)', label: 'Europa League' },
                              { color: 'rgba(239,68,68,0.7)', label: 'Relegation' },
                            ].map(z => (
                              <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: z.color }} />
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{z.label}</span>
                              </div>
                            ))}
                          </div>
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
