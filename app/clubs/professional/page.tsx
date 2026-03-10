import Navbar from "../../../components/Navbar";
import PageHeader from "../../../components/layout/PageHeader";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Club = {
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
  latitude: number;
  longitude: number;
  distance?: number;
};

type LocationData = {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
};

// Function to calculate distance between two coordinates (simplified)
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

// Mock club data with coordinates (in a real app, this would come from the database)
const mockClubs: (Club & { latitude: number; longitude: number })[] = [
  {
    id: "1",
    name: "Manchester United FC",
    city: "Manchester",
    region: "North West",
    type: "Professional",
    founded_year: 1878,
    description: "One of the most successful football clubs in the world.",
    website_url: "https://www.manutd.com",
    logo_url: null,
    verification_level: 4,
    latitude: 53.4631,
    longitude: -2.2913
  },
  {
    id: "2", 
    name: "Liverpool FC",
    city: "Liverpool",
    region: "North West",
    type: "Professional",
    founded_year: 1892,
    description: "Historic English football club with a rich legacy.",
    website_url: "https://www.liverpoolfc.com",
    logo_url: null,
    verification_level: 4,
    latitude: 53.4308,
    longitude: -2.9608
  },
  {
    id: "3",
    name: "Chelsea FC", 
    city: "London",
    region: "London",
    type: "Professional",
    founded_year: 1905,
    description: "Premier League club based in West London.",
    website_url: "https://www.chelseafc.com",
    logo_url: null,
    verification_level: 4,
    latitude: 51.4816,
    longitude: -0.1909
  },
  {
    id: "4",
    name: "Arsenal FC",
    city: "London", 
    region: "London",
    type: "Professional",
    founded_year: 1886,
    description: "North London-based professional football club.",
    website_url: "https://www.arsenal.com",
    logo_url: null,
    verification_level: 4,
    latitude: 51.5549,
    longitude: -0.1084
  },
  {
    id: "5",
    name: "Manchester City FC",
    city: "Manchester",
    region: "North West", 
    type: "Professional",
    founded_year: 1880,
    description: "Premier League champions and European powerhouse.",
    website_url: "https://www.mancity.com",
    logo_url: null,
    verification_level: 4,
    latitude: 53.4831,
    longitude: -2.2004
  }
];

export default async function ProfessionalClubsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's saved location from profile
  let userLocation: LocationData | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("city, region")
    .eq("id", user.id)
    .single();

  if (profile?.city) {
    // Mock coordinates for user's city (in a real app, use geocoding API)
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

  // Categorize clubs based on location
  const nearbyClubs: typeof mockClubs = [];
  const sameCityClubs: typeof mockClubs = [];
  const otherClubs: typeof mockClubs = [];

  mockClubs.forEach(club => {
    const distance = calculateDistance(
      userLocation!.latitude,
      userLocation!.longitude,
      club.latitude,
      club.longitude
    );

    if (distance < 50) { // Within 50km
      nearbyClubs.push({ ...club, distance });
    } else if (club.city === userLocation!.city) {
      sameCityClubs.push({ ...club, distance });
    } else {
      otherClubs.push({ ...club, distance });
    }
  });

  // Sort by distance
  nearbyClubs.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  sameCityClubs.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  otherClubs.sort((a, b) => (a.distance || 0) - (b.distance || 0));

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
            eyebrow="Professional Clubs"
            title="Discover Opportunities"
            subtitle={`Showing clubs near ${userLocation.city} and beyond`}
            centered={false}
          />

          {/* Location indicator */}
          <div className="mt-4 flex items-center gap-2 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300 shadow-lg backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location: {userLocation.city}, {userLocation.region}
          </div>
        </div>

        {/* Nearby Clubs */}
        {nearbyClubs.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Nearby Clubs</h2>
                <p className="text-sm text-slate-400">Clubs within 50km of your location</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {nearbyClubs.map((club) => (
                <ClubCard key={club.id} club={club} verificationBadges={verificationBadges} />
              ))}
            </div>
          </div>
        )}

        {/* Same City Clubs */}
        {sameCityClubs.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Clubs in {userLocation.city}</h2>
                <p className="text-sm text-slate-400">More clubs in your city</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {sameCityClubs.map((club) => (
                <ClubCard key={club.id} club={club} verificationBadges={verificationBadges} />
              ))}
            </div>
          </div>
        )}

        {/* Other Cities */}
        {otherClubs.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Other Cities</h2>
                <p className="text-sm text-slate-400">Explore clubs across the UK</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherClubs.map((club) => (
                <ClubCard key={club.id} club={club} verificationBadges={verificationBadges} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ClubCard({ club, verificationBadges }: { 
  club: typeof mockClubs[0]; 
  verificationBadges: any;
}) {
  const badge = verificationBadges[club.verification_level as keyof typeof verificationBadges];

  return (
    <div className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-black text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              {club.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white group-hover:text-sky-100 transition-colors">
                {club.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold ${badge.color}`}>
                  {badge.label}
                </span>
                {club.distance && (
                  <span className="text-xs text-slate-400">
                    {Math.round(club.distance)}km away
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{club.city}, {club.region}</span>
            </div>
            
            {club.founded_year && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Founded {club.founded_year}</span>
              </div>
            )}
          </div>

          {club.description && (
            <p className="mt-3 text-sm text-slate-400 line-clamp-2">
              {club.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            {club.type}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {club.website_url && (
            <a
              href={club.website_url}
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
            href={`/clubs/${club.id}`}
            className="rounded-lg bg-sky-500/20 border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
