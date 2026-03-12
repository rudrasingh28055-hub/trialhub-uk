import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/layout/PageHeader";
import { CreatePostComposer } from "@/components/CreatePostComposer";

export default async function CreatePostPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <section className="relative mx-auto max-w-4xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />

        <div className="relative">
          <PageHeader
            eyebrow="Share Your Journey"
            title="Create Post"
            subtitle="Share highlights, training moments, and achievements with the AthLink community"
            centered
          />

          <div className="mt-8">
            <CreatePostComposer userId={user.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
