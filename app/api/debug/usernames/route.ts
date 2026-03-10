import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use direct Supabase REST API to bypass all RLS issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }
    
    // Get all profiles with their usernames
    const profilesUrl = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name&limit=10`;
    
    const response = await fetch(profilesUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }
    
    const profiles = await response.json();
    
    // Also get users table data
    const usersUrl = `${supabaseUrl}/rest/v1/users?select=id,email,role&limit=10`;
    
    const usersResponse = await fetch(usersUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const users = usersResponse.ok ? await usersResponse.json() : null;
    
    return NextResponse.json({
      profiles,
      users,
      message: "These are the available usernames you can use",
      availableUsernames: profiles.map((p: any) => p.username).filter(Boolean)
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
