import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, city, role } = body;
    
    // Use the authenticated user instead of creating a test user
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Must be authenticated" }, { status: 401 });
    }
    
    console.log("Using authenticated user:", user.id);
    
    // Step 1: Ensure user exists in users table
    const { error: userError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email!,
        role: role,
        status: "active",
      },
      { onConflict: "id" }
    );

    if (userError) {
      console.log("User upsert error:", userError);
      return NextResponse.json({ error: `User upsert failed: ${userError.message}` }, { status: 400 });
    }
    
    // Step 2: Create profile with same ID as user
    const username = `${role}_${user.id.slice(0, 6)}`;
    
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id, // Use same ID as user
        user_id: user.id,
        username: username,
        display_name: fullName?.trim() || null,
        full_name: fullName?.trim() || null,
        city: city?.trim() || null,
        role: role,
        account_visibility: "public",
        discoverability_policy: "everyone",
        message_policy: "requests",
        verification_status: "unverified",
        trusted_status: "none",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.log("Profile upsert error:", profileError);
      return NextResponse.json({ error: `Profile upsert failed: ${profileError.message}` }, { status: 400 });
    }
    
    // Step 3: Create role-specific profile
    let roleError;
    if (role === "athlete") {
      const { error } = await supabase.from("athlete_profiles").upsert(
        { user_id: user.id },
        { onConflict: "user_id" }
      );
      roleError = error;
    } else {
      const { error } = await supabase.from("club_profiles").upsert(
        { 
          user_id: user.id,
          club_name: fullName?.trim() || "Club Name"
        },
        { onConflict: "user_id" }
      );
      roleError = error;
    }
    
    if (roleError) {
      console.log("Role profile error:", roleError);
      return NextResponse.json({ error: `Role profile failed: ${roleError.message}` }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Profile created successfully using authenticated user",
      username: username,
      userId: user.id
    });
    
  } catch (error) {
    console.error("Authenticated profile creation error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
