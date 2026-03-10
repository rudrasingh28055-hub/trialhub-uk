import { SocialGraphRepository } from "./repository";

export class SocialGraphService {
  constructor(private readonly repository: SocialGraphRepository) {}

  async followUser(followerUserId: string, targetUsername: string) {
    const target = await this.repository.getTargetByUsername(targetUsername);
    if (!target) throw new Error("User not found");
    if (target.user_id === followerUserId) throw new Error("Cannot follow yourself");

    const status = target.account_visibility === "private" ? "pending" : "approved";
    await this.repository.upsertFollow(followerUserId, target.user_id, status);
    return { status };
  }

  async unfollowUser(followerUserId: string, targetUsername: string) {
    const target = await this.repository.getTargetByUsername(targetUsername);
    if (!target) throw new Error("User not found");
    await this.repository.removeFollow(followerUserId, target.user_id);
  }

  async getFollowRequests(userId: string) {
    return this.repository.getPendingFollowRequests(userId);
  }

  async approveFollowRequest(currentUserId: string, requesterUserId: string) {
    await this.repository.setFollowStatus(requesterUserId, currentUserId, "approved");
  }

  async rejectFollowRequest(currentUserId: string, requesterUserId: string) {
    await this.repository.setFollowStatus(requesterUserId, currentUserId, "rejected");
  }
}
