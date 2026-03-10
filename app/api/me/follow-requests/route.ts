import { NextResponse } from "next/server";
import { getAuthUserOrThrow } from "@/lib/shared/auth/get-auth-user";
import { SocialGraphRepository } from "@/lib/domain/social-graph/repository";
import { SocialGraphService } from "@/lib/domain/social-graph/service";
import { featureFlags } from "@/lib/adapters/feature-flags";

export async function GET() {
  if (!featureFlags.privacyV2Enabled) {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 });
  }

  try {
    const { user, supabase } = await getAuthUserOrThrow();
    const service = new SocialGraphService(new SocialGraphRepository(supabase));
    const followRequests = await service.getFollowRequests(user.id);

    return NextResponse.json({ followRequests });
  } catch (error) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
