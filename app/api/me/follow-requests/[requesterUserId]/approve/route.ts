import { NextResponse } from "next/server";
import { getAuthUserOrThrow } from "@/lib/shared/auth/get-auth-user";
import { SocialGraphRepository } from "@/lib/domain/social-graph/repository";
import { SocialGraphService } from "@/lib/domain/social-graph/service";
import { featureFlags } from "@/lib/adapters/feature-flags";

export async function POST(
  _: Request,
  ctx: { params: Promise<{ requesterUserId: string }> }
) {
  if (!featureFlags.privacyV2Enabled) {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 });
  }

  try {
    const { user, supabase } = await getAuthUserOrThrow();
    const { requesterUserId } = await ctx.params;

    const service = new SocialGraphService(new SocialGraphRepository(supabase));
    await service.approveFollowRequest(user.id, requesterUserId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
