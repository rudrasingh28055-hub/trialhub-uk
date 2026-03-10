import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get profiles with simple query
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .limit(5);
    
    // Get users with simple query
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .limit(5);

    return NextResponse.json({
      profiles: profiles || profilesError?.message || 'No data',
      users: users || usersError?.message || 'No data',
      count: {
        profiles: profiles?.length || 0,
        users: users?.length || 0
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
