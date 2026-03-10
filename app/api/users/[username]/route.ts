import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProfilesRepository } from "@/lib/domain/profiles/repository";

export async function GET(
  _: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;
    const supabase = await createClient();
    
    console.log(`[API] Looking up user: ${username}`);
    
    const repository = new ProfilesRepository(supabase);
    const profile = await repository.findByUsername(username);

    if (!profile) {
      console.log(`[API] User not found: ${username}`);
      
      // Try to find by other fields for debugging
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, email")
        .limit(5);
      
      console.log(`[API] Available profiles:`, allProfiles);
      
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[API] Found profile:`, profile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error(`[API] Error fetching user:`, error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
