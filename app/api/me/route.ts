import { NextResponse } from "next/server";
import { getAuthUserOrThrow } from "@/lib/shared/auth/get-auth-user";
import { ProfilesRepository } from "@/lib/domain/profiles/repository";
import { ProfilesService } from "@/lib/domain/profiles/service";

export async function GET() {
  try {
    const { user, supabase } = await getAuthUserOrThrow();
    
    // Get user data (including role) from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, status")
      .eq("id", user.id)
      .single();
      
    if (userError) {
      console.error("[API /me] User fetch error:", userError);
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }
    
    // Get profile data from profiles table
    const profileService = new ProfilesService(new ProfilesRepository(supabase));
    const profile = await profileService.getMe(user.id);

    return NextResponse.json({
      user: userData,
      profile,
    });
  } catch (error) {
    console.error("[API /me] Error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
