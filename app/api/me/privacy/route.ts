import { NextRequest, NextResponse } from "next/server";
import { getAuthUserOrThrow } from "@/lib/shared/auth/get-auth-user";
import { ProfilesRepository } from "@/lib/domain/profiles/repository";
import { ProfilesService } from "@/lib/domain/profiles/service";
import { featureFlags } from "@/lib/adapters/feature-flags";

export async function PATCH(req: NextRequest) {
  if (!featureFlags.privacyV2Enabled) {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 });
  }

  try {
    const { user, supabase } = await getAuthUserOrThrow();
    const body = await req.json();

    const service = new ProfilesService(new ProfilesRepository(supabase));
    await service.updatePrivacy(user.id, body);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
