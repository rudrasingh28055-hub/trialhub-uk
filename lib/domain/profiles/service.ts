import { updatePrivacySchema, updateProfileSchema } from "./validators";
import type { UpdatePrivacyInput, UpdateProfileInput } from "./types";
import { ProfilesRepository } from "./repository";

export class ProfilesService {
  constructor(private readonly repository: ProfilesRepository) {}

  async getMe(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async updateProfile(userId: string, raw: UpdateProfileInput) {
    const input = updateProfileSchema.parse(raw);
    await this.repository.updateByUserId(userId, input);
  }

  async updatePrivacy(userId: string, raw: UpdatePrivacyInput) {
    const input = updatePrivacySchema.parse(raw);
    await this.repository.updatePrivacyByUserId(userId, input);
  }
}
