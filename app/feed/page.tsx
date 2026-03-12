import Navbar from "@/components/Navbar";
import PageHeader from "@/components/layout/PageHeader";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { colors, typography, styles, borderRadius } from "@/lib/design/tokens";

export default async function FeedPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  let userId: string | undefined;
  let userRole: string | undefined;
  
  if (user) {
    userId = user.id;
    
    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    userRole = profile?.role;
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: colors.black }}>
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="relative">
          <div className="flex items-center justify-between">
            <PageHeader
              eyebrow="DISCOVERY"
              title="FEED"
              subtitle={userRole === 'club' 
                ? "Discover talent through player highlights and achievements"
                : "Share your highlights and discover other players"
              }
              centered={false}
            />
            
            {/* Create Post Button */}
            <Link
              href="/post/create"
              className="flex items-center gap-2 transition-all"
              style={{ 
                ...styles.pillBorder, 
                backgroundColor: colors.accent, 
                color: colors.white,
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: typography.display,
                ...styles.displayHeader
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              CREATE POST
            </Link>
          </div>

          <div className="mt-8">
            <FeedContainer 
              currentUserId={userId}
              userRole={userRole}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
