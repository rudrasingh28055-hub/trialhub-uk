import Navbar from "@/components/Navbar"
import PageHeader from "@/components/layout/PageHeader"
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Academy = {
  id: string;
  name: string;
  city: string;
  region: string;
  type: string;
  founded_year: number | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  verification_level: number;
  age_groups: string[];
  training_focus: string[];
  latitude: number;
  longitude: number;
  distance?: number;
};

// Mock academy data with coordinates
const mockAcademies: Academy[] = [
  {
    id: "1",
    name: "Manchester United Academy",
    city: "Manchester",
    region: "North West",
    type: "Professional Academy",
    founded_year: 1938,
    description: "World-renowned youth development program producing top-tier talent.",
    website_url: "https://www.manutd.com/academy",
    logo_url: null,
    verification_level: 4,
    age_groups: ["U9", "U12", "U14", "U16", "U18", "U23"],
    training_focus: ["Technical", "Tactical", "Physical", "Mental"],
    latitude: 53.4631,
    longitude: -2.2913
  },
  {
    id: "2",
    name: "Chelsea FC Academy",
    city: "London",
    region: "London",
    type: "Professional Academy",
    founded_year: 1992,
    description: "Elite youth development with state-of-the-art facilities.",
    website_url: "https://www.chelseafc.com/academy",
    logo_url: null,
    verification_level: 4,
    age_groups: ["U8", "U9", "U12", "U14", "U16", "U18", "U23"],
    training_focus: ["Technical", "Tactical", "Physical"],
    latitude: 51.4816,
    longitude: -0.1909
  },
  {
    id: "3",
    name: "Arsenal Football Academy",
    city: "London",
    region: "London",
    type: "Professional Academy",
    founded_year: 1998,
    description: "Premier league academy focused on developing world-class players.",
    website_url: "https://www.arsenal.com/academy",
    logo_url: null,
    verification_level: 4,
    age_groups: ["U9", "U12", "U14", "U16", "U18", "U23"],
    training_focus: ["Technical", "Tactical", "Mental"],
    latitude: 51.5549,
    longitude: -0.1084
  },
  {
    id: "4",
    name: "Liverpool FC Academy",
    city: "Liverpool",
    region: "North West",
    type: "Professional Academy",
    founded_year: 1998,
    description: "Elite youth development program with proven track record.",
    website_url: "https://www.liverpoolfc.com/academy",
    logo_url: null,
    verification_level: 4,
    age_groups: ["U9", "U12", "U14", "U16", "U18", "U23"],
    training_focus: ["Technical", "Tactical", "Physical"],
    latitude: 53.4308,
    longitude: -2.9608
  },
  {
    id: "5",
    name: "West Ham United Academy",
    city: "London",
    region: "London",
    type: "Professional Academy",
    founded_year: 1998,
    description: "Academy of Football with focus on developing young talent.",
    website_url: "https://www.whufc.com/academy",
    logo_url: null,
    verification_level: 3,
    age_groups: ["U9", "U12", "U14", "U16", "U18"],
    training_focus: ["Technical", "Tactical"],
    latitude: 51.5286,
    longitude: 0.0315
  }
];

export default async function AcademiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's saved location from profile
  let userLocation: { latitude: number; longitude: number; city: string; region: string } | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("city, region")
    .eq("id", user.id)
    .single();

  if (profile?.city) {
    // Mock coordinates for user's city
    const cityCoordinates: Record<string, { lat: number; lon: number }> = {
      "Manchester": { lat: 53.4808, lon: -2.2426 },
      "Liverpool": { lat: 53.4084, lon: -2.9916 },
      "London": { lat: 51.5074, lon: -0.1278 },
      "Birmingham": { lat: 52.4862, lon: -1.8904 }
    };

    const coords = cityCoordinates[profile.city];
    if (coords) {
      userLocation = {
        latitude: coords.lat,
        longitude: coords.lon,
        city: profile.city,
        region: profile.region || profile.city
      };
    }
  }

  // If no user location, default to London
  if (!userLocation) {
    userLocation = {
      latitude: 51.5074,
      longitude: -0.1278,
      city: "London",
      region: "London"
    };
  }

  // Function to calculate distance
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Add distance to each academy
  const academiesWithDistance = mockAcademies.map(academy => ({
    ...academy,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      academy.latitude,
      academy.longitude
    )
  }));

  // Sort by distance
  academiesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const verificationBadges = {
    0: { label: "Unverified", color: "text-slate-400" },
    1: { label: "Verified", color: "text-blue-400" },
    2: { label: "Academy", color: "text-emerald-400" },
    3: { label: "Pro", color: "text-amber-400" },
    4: { label: "Elite", color: "text-violet-400" },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />

        <div className="relative">
          <PageHeader
            eyebrow="Football Academies"
            title="Development Programs"
            subtitle={`Elite youth academies near ${userLocation.city} and across the UK`}
            centered={false}
          />

          {/* Location indicator */}
          <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300 shadow-lg backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location: {userLocation.city}, {userLocation.region}
          </div>
        </div>

        {/* Academies Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {academiesWithDistance.map((academy) => (
            <AcademyCard 
              key={academy.id} 
              academy={academy} 
              verificationBadges={verificationBadges} 
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Find Your Development Path</h3>
            <p className="text-slate-300 mb-6">
              Connect with elite football academies across the UK. Each academy offers unique development programs 
              designed to nurture young talent and prepare players for professional careers.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Verified Programs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Elite Coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-400" />
                <span>Professional Pathways</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AcademyCard({ academy, verificationBadges }: { 
  academy: Academy; 
  verificationBadges: any;
}) {
  const badge = verificationBadges[academy.verification_level as keyof typeof verificationBadges];

  return (
    <div className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-lg font-black text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              {academy.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-100 transition-colors">
                {academy.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold ${badge.color}`}>
                  {badge.label}
                </span>
                {academy.distance && (
                  <span className="text-xs text-slate-400">
                    {Math.round(academy.distance)}km away
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{academy.city}, {academy.region}</span>
        </div>
        
        {academy.founded_year && (
          <div className="flex items-center gap-2 text-slate-300">
            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Founded {academy.founded_year}</span>
          </div>
        )}
      </div>

      {/* Age Groups */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-400 mb-2">Age Groups</h4>
        <div className="flex flex-wrap gap-1">
          {academy.age_groups.map((age) => (
            <span 
              key={age}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-300"
            >
              {age}
            </span>
          ))}
        </div>
      </div>

      {/* Training Focus */}
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-slate-400 mb-2">Training Focus</h4>
        <div className="flex flex-wrap gap-1">
          {academy.training_focus.map((focus) => (
            <span 
              key={focus}
              className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-medium text-sky-300"
            >
              {focus}
            </span>
          ))}
        </div>
      </div>

      {academy.description && (
        <p className="mt-4 text-sm text-slate-400 line-clamp-2">
          {academy.description}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            {academy.type}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {academy.website_url && (
            <a
              href={academy.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          
          <Link
            href={`/academies/${academy.id}`}
            className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
