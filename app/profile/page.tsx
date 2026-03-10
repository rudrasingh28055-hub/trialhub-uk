import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/setup");
  }

  if (profile.role === "athlete") {
    redirect("/athlete/profile");
  }

  if (profile.role === "club") {
    redirect("/club/dashboard");
  }

  redirect("/setup");
}
