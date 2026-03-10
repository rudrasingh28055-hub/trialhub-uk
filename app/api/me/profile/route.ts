import { NextRequest, NextResponse } from "next/server";
import { getAuthUserOrThrow } from "@/lib/shared/auth/get-auth-user";
import { ProfilesRepository } from "@/lib/domain/profiles/repository";
import { ProfilesService } from "@/lib/domain/profiles/service";

export async function PATCH(req: NextRequest) {
  try {
    const { user, supabase } = await getAuthUserOrThrow();
    const body = await req.json();

    const service = new ProfilesService(new ProfilesRepository(supabase));
    await service.updateProfile(user.id, body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
