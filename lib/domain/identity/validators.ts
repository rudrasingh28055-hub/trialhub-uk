import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['athlete', 'club', 'admin']),
});

export const updateUserSchema = z.object({
  role: z.enum(['athlete', 'club', 'admin']).optional(),
  status: z.enum(['active', 'pending_review', 'suspended', 'deleted']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
