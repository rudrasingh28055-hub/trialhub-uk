import { getServerSupabase } from "@/lib/adapters/supabase/server";

export async function getAuthUserOrThrow() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { user, supabase };
}
