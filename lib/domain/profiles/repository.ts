import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UpdatePrivacyInput, UpdateProfileInput } from "./types";

export class ProfilesRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    console.log(`[Repository] Looking up username: ${username}`);
    
    // Try exact match first
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    console.log(`[Repository] Exact match result:`, { data, error });

    if (error) {
      console.error(`[Repository] Database error:`, error);
      throw error;
    }

    if (data) {
      console.log(`[Repository] Found profile for username: ${username}`);
      return data;
    }

    // Try case-insensitive match
    const { data: caseInsensitiveData, error: caseInsensitiveError } = await this.db
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();

    console.log(`[Repository] Case-insensitive result:`, { data: caseInsensitiveData, error: caseInsensitiveError });

    if (caseInsensitiveError) {
      console.error(`[Repository] Case-insensitive error:`, caseInsensitiveError);
      throw caseInsensitiveError;
    }

    if (caseInsensitiveData) {
      console.log(`[Repository] Found profile with case-insensitive match: ${username}`);
      return caseInsensitiveData;
    }

    console.log(`[Repository] No profile found for username: ${username}`);
    return null;
  }

  async updateByUserId(userId: string, input: UpdateProfileInput) {
    const { error } = await this.db.from("profiles").update(input).eq("user_id", userId);
    if (error) throw error;
  }

  async updatePrivacyByUserId(userId: string, input: UpdatePrivacyInput) {
    const { error } = await this.db.from("profiles").update(input).eq("user_id", userId);
    if (error) throw error;
  }
}
