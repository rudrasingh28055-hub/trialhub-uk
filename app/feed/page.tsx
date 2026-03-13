import Navbar from "@/components/Navbar";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { colors } from "@/lib/design/tokens";

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
      .eq("user_id", user.id)
      .single();
    
    userRole = profile?.role;
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: colors.obsidian }}>
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-6 py-8 pt-10">
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>DISCOVERY</p>
              <h1 style={{ color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em', margin: 0 }}>Feed</h1>
            </div>

            {/* Create Post Button */}
            <Link
              href="/post/create"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: '#7C3AED', color: 'white',
                padding: '10px 20px', borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Satoshi', sans-serif",
                textDecoration: 'none', letterSpacing: '-0.01em',
                transition: 'opacity 0.15s'
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New post
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
