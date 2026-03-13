"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { colors, typography, gradient, glassPanel, borderRadius } from "@/lib/design/tokens";

interface Profile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  bio: string | null;
  city: string | null;
}

interface PlayerProfile {
  age: number | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  previous_club: string | null;
  video_url: string | null;
  instagram_url: string | null;
  avatar_url: string | null;
}

function Avatar({ name, avatarUrl, size = 120 }: { name: string; avatarUrl: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "3px solid rgba(124,58,237,0.5)",
          boxShadow: "0 0 32px rgba(124,58,237,0.3)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 900,
        color: "#fff",
        border: "3px solid rgba(124,58,237,0.5)",
        boxShadow: "0 0 32px rgba(124,58,237,0.3)",
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: colors.white, lineHeight: 1.2 }}>{value || "—"}</div>
      <div style={{ fontSize: 11, color: colors.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

export default function PlayerProfile() {
  const params = useParams();
  const playerId = params?.playerId as string;
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!playerId) return;

    async function load() {
      setLoading(true);

      // Load profile data
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, bio, city")
        .eq("id", playerId)
        .maybeSingle();

      if (prof) {
        setProfile(prof);

        const { data: pp } = await supabase
          .from("player_profiles")
          .select("age, primary_position, secondary_position, dominant_foot, height_cm, previous_club, video_url, instagram_url, avatar_url")
          .eq("profile_id", prof.id)
          .maybeSingle();

        setPlayerProfile(pp ?? null);
      }

      // Check viewer identity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: viewerProf } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (viewerProf) {
          setViewerRole(viewerProf.role ?? null);
          setIsOwnProfile(viewerProf.id === playerId);
        }
      }

      setLoading(false);
    }

    load();
  }, [playerId]);

  const displayName = profile?.display_name || profile?.full_name || "Athlete";
  const position = playerProfile?.primary_position || "";
  const secondaryPosition = playerProfile?.secondary_position || "";
  const foot = playerProfile?.dominant_foot ? (playerProfile.dominant_foot.charAt(0).toUpperCase() + playerProfile.dominant_foot.slice(1) + " foot") : "";
  const height = playerProfile?.height_cm ? `${playerProfile.height_cm} cm` : "";
  const previousClub = playerProfile?.previous_club || "";
  const age = playerProfile?.age ? `Age ${playerProfile.age}` : "";
  const city = profile?.city || "";
  const bio = profile?.bio || "";

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.obsidian, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(124,58,237,0.2)",
              borderTop: "3px solid #7C3AED",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: colors.muted, fontSize: 14 }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.obsidian, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <h2 style={{ color: colors.white, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Player not found</h2>
          <p style={{ color: colors.muted, marginBottom: 24 }}>This profile doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/")}
            style={{
              background: gradient.violet,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.obsidian }}>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Background gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(11,11,15,0) 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "56px 24px 40px" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Avatar + name row */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
              <Avatar name={displayName} avatarUrl={playerProfile?.avatar_url ?? null} size={120} />

              <div>
                <h1 style={{
                  fontFamily: "'Satoshi', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(28px, 5vw, 44px)",
                  color: colors.white,
                  letterSpacing: "-0.04em",
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  {displayName}
                </h1>

                {/* Position badges */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12 }}>
                  {position && (
                    <span style={{
                      background: "rgba(124,58,237,0.18)",
                      border: "1px solid rgba(124,58,237,0.4)",
                      color: "#A78BFA",
                      borderRadius: 999,
                      padding: "4px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                    }}>
                      {position}
                    </span>
                  )}
                  {secondaryPosition && (
                    <span style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: colors.muted,
                      borderRadius: 999,
                      padding: "4px 14px",
                      fontSize: 13,
                      fontWeight: 500,
                    }}>
                      {secondaryPosition}
                    </span>
                  )}
                </div>

                {/* Location + age */}
                {(city || age) && (
                  <p style={{ color: colors.muted, fontSize: 14, marginTop: 10 }}>
                    {[city, age].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              {/* Stats strip */}
              {(height || foot || previousClub) && (
                <div style={{
                  display: "flex",
                  gap: 32,
                  marginTop: 8,
                  padding: "16px 28px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                }}>
                  {height && <StatPill label="Height" value={height} />}
                  {foot && <StatPill label="Foot" value={foot} />}
                  {previousClub && <StatPill label="Previous Club" value={previousClub} />}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Highlight Reel */}
        {playerProfile?.video_url && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{
              fontFamily: "'Satoshi', Inter, sans-serif",
              fontWeight: 900,
              fontSize: 20,
              color: colors.white,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}>
              Highlight Reel
            </h2>
            <div style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              aspectRatio: "16/9",
            }}>
              <video
                src={playerProfile.video_url}
                controls
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                poster=""
              />
            </div>
          </motion.section>
        )}

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: 32 }}
        >
          <h2 style={{
            fontFamily: "'Satoshi', Inter, sans-serif",
            fontWeight: 900,
            fontSize: 20,
            color: colors.white,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}>
            Career Stats
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { label: "Matches Played", value: "—", icon: "⚽" },
              { label: "Goals", value: "—", icon: "🎯" },
              { label: "Assists", value: "—", icon: "🅰️" },
              { label: "Hours Trained", value: "—", icon: "⏱️" },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "20px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 28 }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: colors.white, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* About */}
        {(bio || isOwnProfile) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: 32 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{
                fontFamily: "'Satoshi', Inter, sans-serif",
                fontWeight: 900,
                fontSize: 20,
                color: colors.white,
                letterSpacing: "-0.02em",
                margin: 0,
              }}>
                About
              </h2>
              {isOwnProfile && (
                <button
                  onClick={() => router.push("/athlete/profile")}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: colors.muted,
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                >
                  Edit profile
                </button>
              )}
            </div>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "20px 24px",
            }}>
              {bio ? (
                <p style={{ color: "#C4C4CC", fontSize: 15, lineHeight: 1.7, margin: 0 }}>{bio}</p>
              ) : (
                <p style={{ color: colors.muted, fontSize: 14, margin: 0, fontStyle: "italic" }}>
                  No bio yet.{isOwnProfile ? " Add one to help scouts understand your background." : ""}
                </p>
              )}

              {/* Social */}
              {playerProfile?.instagram_url && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <a
                    href={`https://instagram.com/${playerProfile.instagram_url.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#A78BFA",
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{playerProfile.instagram_url.replace(/^@/, "")}
                  </a>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Scout Actions */}
        {(viewerRole === "club" || viewerRole === "scout") && !isOwnProfile && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{
              fontFamily: "'Satoshi', Inter, sans-serif",
              fontWeight: 900,
              fontSize: 20,
              color: colors.white,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}>
              Scout Actions
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button
                onClick={() => router.push("/messages")}
                style={{
                  background: gradient.violet,
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Send Message
              </button>
              <button
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: colors.white,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save Player
              </button>
              <button
                onClick={handleShare}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: copied ? colors.success : colors.white,
                  border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {copied ? "Link copied!" : "Share Profile"}
              </button>
            </div>
          </motion.section>
        )}

        {/* Own profile CTA if incomplete */}
        {isOwnProfile && !playerProfile?.primary_position && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 16,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ color: colors.white, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Complete your profile</div>
              <div style={{ color: colors.muted, fontSize: 14 }}>Add your position, height, and club history to attract scouts.</div>
            </div>
            <button
              onClick={() => router.push("/athlete/profile")}
              style={{
                background: gradient.violet,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Edit profile
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
