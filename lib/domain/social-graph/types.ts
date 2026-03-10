export type FollowStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface FollowRequestRow {
  follower_user_id: string;
  followed_user_id: string;
  status: FollowStatus;
  created_at: string;
  approved_at: string | null;
  follower_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}
