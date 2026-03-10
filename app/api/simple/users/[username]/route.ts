import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;
    
    console.log(`[SimpleAPI] Looking up username: ${username}`);
    
    // Use direct Supabase client with service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!; // Use publishable key for now
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }
    
    // Create a simple fetch request to Supabase REST API
    const profilesUrl = `${supabaseUrl}/rest/v1/profiles?username=eq.${username}&select=id,username,full_name,avatar_url,city,account_visibility,discoverability_policy,message_policy`;
    
    console.log(`[SimpleAPI] Fetching from: ${profilesUrl}`);
    
    const response = await fetch(profilesUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    console.log(`[SimpleAPI] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[SimpleAPI] Response error: ${errorText}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const data = await response.json();
    console.log(`[SimpleAPI] Profile data:`, data);
    
    if (!data || data.length === 0) {
      // Try case-insensitive search
      const caseInsensitiveUrl = `${supabaseUrl}/rest/v1/profiles?username=ilike.${username}&select=id,username,full_name,avatar_url,city,account_visibility,discoverability_policy,message_policy`;
      
      console.log(`[SimpleAPI] Trying case-insensitive search: ${caseInsensitiveUrl}`);
      
      const caseResponse = await fetch(caseInsensitiveUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      
      if (caseResponse.ok) {
        const caseData = await caseResponse.json();
        console.log(`[SimpleAPI] Case-insensitive result:`, caseData);
        
        if (caseData && caseData.length > 0) {
          return NextResponse.json(caseData[0]);
        }
      }
      
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error(`[SimpleAPI] Error:`, error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
