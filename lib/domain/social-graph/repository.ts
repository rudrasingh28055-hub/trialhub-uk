import type { SupabaseClient } from "@supabase/supabase-js";

export class SocialGraphRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getTargetByUsername(username: string) {
    const { data, error } = await this.db
      .from("profiles")
      .select("user_id, username, account_visibility")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async upsertFollow(followerUserId: string, followedUserId: string, status: "pending" | "approved") {
    const { error } = await this.db.from("follow_edges").upsert(
      {
        follower_user_id: followerUserId,
        followed_user_id: followedUserId,
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      },
      { onConflict: "follower_user_id,followed_user_id" }
    );

    if (error) throw error;
  }

  async removeFollow(followerUserId: string, followedUserId: string) {
    const { error } = await this.db
      .from("follow_edges")
      .delete()
      .eq("follower_user_id", followerUserId)
      .eq("followed_user_id", followedUserId);

    if (error) throw error;
  }

  async getPendingFollowRequests(targetUserId: string) {
    const { data, error } = await this.db
      .from("follow_edges")
      .select(`
        follower_user_id,
        followed_user_id,
        status,
        created_at,
        approved_at
      `)
      .eq("followed_user_id", targetUserId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async setFollowStatus(followerUserId: string, followedUserId: string, status: "approved" | "rejected") {
    const patch =
      status === "approved"
        ? { status, approved_at: new Date().toISOString() }
        : { status };

    const { error } = await this.db
      .from("follow_edges")
      .update(patch)
      .eq("follower_user_id", followerUserId)
      .eq("followed_user_id", followedUserId)
      .eq("status", "pending");

    if (error) throw error;
  }
}
