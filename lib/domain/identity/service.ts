import { createUserSchema, updateUserSchema } from "./validators";
import type { CreateUserInput, UpdateUserInput, User } from "./types";
import { IdentityRepository } from "./repository";

export class IdentityService {
  constructor(private readonly repository: IdentityRepository) {}

  async getMe(userId: string): Promise<User | null> {
    return this.repository.findById(userId);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const validated = createUserSchema.parse(input);
    return this.repository.create(validated);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const validated = updateUserSchema.parse(input);
    return this.repository.update(userId, validated);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }
}
