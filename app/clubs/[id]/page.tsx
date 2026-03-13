import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("club_profiles")
    .select("id, club_name, city, region, country, founded_year, description, club_type, tier, logo_url, website_url, profile_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!club) {
    notFound();
  }

  let baseProfile: { full_name: string | null; display_name: string | null } | null = null;
  if (club.profile_id) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", club.profile_id)
      .maybeSingle();
    baseProfile = data;
  }

  const clubName = club.club_name || baseProfile?.display_name || baseProfile?.full_name || "Club";
  const location = [club.city, club.region, club.country].filter(Boolean).join(", ");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B0B0F" }}>
      <Navbar />

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(124,58,237,0.15) 0%, rgba(11,11,15,0) 100%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "72px 24px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
            {/* Logo */}
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={clubName}
                style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(124,58,237,0.4)", boxShadow: "0 0 32px rgba(124,58,237,0.25)" }}
              />
            ) : (
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 40, fontWeight: 900, color: "#fff",
                border: "3px solid rgba(124,58,237,0.4)", boxShadow: "0 0 32px rgba(124,58,237,0.25)",
              }}>
                {clubName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 style={{
                fontFamily: "'Satoshi', Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(28px, 5vw, 42px)",
                color: "#F8FAFC",
                letterSpacing: "-0.04em",
                margin: 0,
                lineHeight: 1.1,
              }}>
                {clubName}
              </h1>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
                {club.club_type && (
                  <span style={{
                    background: "rgba(124,58,237,0.18)",
                    border: "1px solid rgba(124,58,237,0.4)",
                    color: "#A78BFA",
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {club.club_type}
                  </span>
                )}
                {club.tier && (
                  <span style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)",
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                  }}>
                    Tier {club.tier}
                  </span>
                )}
              </div>

              {(location || club.founded_year) && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 10 }}>
                  {[location, club.founded_year ? `Est. ${club.founded_year}` : null].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Description */}
        {club.description && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "'Satoshi', Inter, sans-serif",
              fontWeight: 900,
              fontSize: 20,
              color: "#F8FAFC",
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}>
              About the Club
            </h2>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "20px 24px",
            }}>
              <p style={{ color: "#C4C4CC", fontSize: 15, lineHeight: 1.7, margin: 0 }}>{club.description}</p>
            </div>
          </section>
        )}

        {/* Info Cards */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {location && (
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "18px 20px",
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Location</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>{location}</div>
              </div>
            )}
            {club.founded_year && (
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "18px 20px",
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Founded</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>{club.founded_year}</div>
              </div>
            )}
            {club.club_type && (
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "18px 20px",
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Type</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>{club.club_type}</div>
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link
              href="/messages"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                color: "#fff",
                borderRadius: 12,
                padding: "12px 24px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Send Message
            </Link>

            {club.website_url && (
              <a
                href={club.website_url.startsWith("http") ? club.website_url : `https://${club.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#F8FAFC",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Visit Website
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
