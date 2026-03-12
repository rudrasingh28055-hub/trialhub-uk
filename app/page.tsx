import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppLayout from "@/components/AppLayout";
import HomeClient from "./HomeClient";
import { colors, typography, borderRadius, glassPanel, pitchGrid, gradient } from "@/lib/design/tokens";
import { createClient } from "@/lib/supabase/server";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user?.id)
    .single();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <HomeClient 
      opportunities={opportunities || []}
      user={user}
      role={profile?.role}
      displayName={profile?.display_name}
    />
  );
}