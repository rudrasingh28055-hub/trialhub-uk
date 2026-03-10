import Navbar from "../../components/Navbar";
import PageHeader from "../../components/layout/PageHeader";
import { FeedContainer } from "../../components/feed/FeedContainer";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <PageHeader
              eyebrow="Discovery"
              title="Feed"
              subtitle={userRole === 'club' 
                ? "Discover talent through player highlights and achievements"
                : "Share your highlights and discover other players"
              }
              centered={false}
            />
            
            {/* Create Post Button */}
            <Link
              href="/post/create"
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:from-sky-400 hover:to-indigo-400 transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Post
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
