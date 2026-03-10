import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    // Use browser client for debugging (no auth required for basic queries)
    const supabase = createClient();
    
    console.log("Debug: Testing with browser client");
    
    // Test if profiles table exists and is accessible
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .limit(3);
    
    console.log("Profiles result:", { profiles, profilesError });

    // Test if users table exists
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .limit(3);
    
    console.log("Users result:", { users, usersError });

    return NextResponse.json({
      profiles: {
        data: profiles,
        error: profilesError?.message,
        count: profiles?.length || 0
      },
      users: {
        data: users,
        error: usersError?.message,
        count: users?.length || 0
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
