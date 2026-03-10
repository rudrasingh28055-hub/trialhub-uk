import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, city, role } = body;
    
    // Use direct Supabase REST API to test profile creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }
    
    console.log("Test API: Creating profile with", { fullName, city, role });
    
    // Generate a proper UUID for testing
    const testUserId = crypto.randomUUID();
    console.log("Generated test UUID:", testUserId);
    
    // Test 1: Create user entry
    const userUrl = `${supabaseUrl}/rest/v1/users`;
    
    const userResponse = await fetch(userUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: testUserId,
        email: `test-${testUserId.slice(0, 8)}@example.com`,
        role: role,
        status: 'active'
      })
    });
    
    console.log("User creation status:", userResponse.status);
    
    if (!userResponse.ok) {
      const userError = await userResponse.text();
      console.log("User creation error:", userError);
      return NextResponse.json({ error: `User creation failed: ${userError}` }, { status: 400 });
    }
    
    console.log("User created successfully, proceeding with profile creation");
    
    // Verify user was actually created
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${testUserId}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log("User verification:", verifyData);
      if (!verifyData || verifyData.length === 0) {
        return NextResponse.json({ error: "User creation verification failed" }, { status: 400 });
      }
    }
    
    // Test 2: Create profile entry with same ID as user (to satisfy foreign key)
    const profileUrl = `${supabaseUrl}/rest/v1/profiles`;
    const username = `${role}_${testUserId.slice(0, 6)}`;
    
    const profileResponse = await fetch(profileUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: testUserId, // Use same ID as user to satisfy foreign key
        user_id: testUserId,
        username: username,
        display_name: fullName?.trim() || null,
        full_name: fullName?.trim() || null,
        city: city?.trim() || null,
        role: role, // Add role to satisfy NOT NULL constraint
        account_visibility: 'public',
        discoverability_policy: 'everyone',
        message_policy: 'requests',
        verification_status: 'unverified',
        trusted_status: 'none'
      })
    });
    
    console.log("Profile creation status:", profileResponse.status);
    
    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      console.log("Profile creation error:", profileError);
      
      // Clean up user on profile failure
      await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${testUserId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      
      return NextResponse.json({ error: `Profile creation failed: ${profileError}` }, { status: 400 });
    }
    
    // Test 3: Create role-specific profile
    let roleProfileUrl;
    let roleProfileData;
    
    if (role === 'athlete') {
      roleProfileUrl = `${supabaseUrl}/rest/v1/athlete_profiles`;
      roleProfileData = { user_id: testUserId };
    } else {
      roleProfileUrl = `${supabaseUrl}/rest/v1/club_profiles`;
      roleProfileData = { 
        user_id: testUserId,
        club_name: fullName?.trim() || 'Club Name'
      };
    }
    
    const roleResponse = await fetch(roleProfileUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(roleProfileData)
    });
    
    console.log("Role profile creation status:", roleResponse.status);
    
    if (!roleResponse.ok) {
      const roleError = await roleResponse.text();
      console.log("Role profile creation error:", roleError);
      return NextResponse.json({ error: `Role profile creation failed: ${roleError}` }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Test profile created successfully",
      testUserId,
      username,
      debug: {
        userStatus: userResponse.status,
        profileStatus: profileResponse.status,
        roleStatus: roleResponse.status
      }
    });
    
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
