import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(80).optional(),
  full_name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  city: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
});

export const updatePrivacySchema = z.object({
  account_visibility: z.enum(["public", "private"]).optional(),
  discoverability_policy: z.enum(["everyone", "logged_in_only", "limited"]).optional(),
  message_policy: z.enum(["open", "requests", "restricted"]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
