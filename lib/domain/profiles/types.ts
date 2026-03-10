export type AccountVisibility = "public" | "private";
export type DiscoverabilityPolicy = "everyone" | "logged_in_only" | "limited";
export type MessagePolicy = "open" | "requests" | "restricted";

export interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  account_visibility: AccountVisibility;
  discoverability_policy: DiscoverabilityPolicy;
  message_policy: MessagePolicy;
}

export interface UpdateProfileInput {
  display_name?: string;
  full_name?: string;
  username?: string;
  city?: string;
  avatar_url?: string;
}

export interface UpdatePrivacyInput {
  account_visibility?: AccountVisibility;
  discoverability_policy?: DiscoverabilityPolicy;
  message_policy?: MessagePolicy;
}
