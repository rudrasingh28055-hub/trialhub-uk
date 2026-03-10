import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clubProfileId, ...trialData } = body;

    // Verify club ownership
    const { data: clubProfile } = await supabase
      .from("club_profiles")
      .select("id")
      .eq("id", clubProfileId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!clubProfile) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Create trial
    const { data: trial, error } = await supabase
      .from("trial_events")
      .insert({
        club_profile_id: clubProfileId,
        ...trialData,
        capacity_remaining: trialData.capacity_total,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating trial:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trial });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get published trials
    const { data: trials, error } = await supabase
      .from("trial_events")
      .select(`
        *,
        club_profiles(id, club_name, city, club_verifications(verification_status, verification_tier))
      `)
      .eq("status", "published")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trials });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
