import type { LeaderboardRepository } from "../leaderboard/leaderboard.repository";
import {
  buildLeaderboardEntryFromUser,
  compareLeaderboardEntries,
  isRankedLeaderboardEntry,
} from "../leaderboard/leaderboard.model";
import type { AuthenticatedUser } from "../../shared/types/auth";
import { normalizeRole } from "../../shared/utils/normalize";
import type { UserRecord, UserProfileResponse } from "./user.model";
import { toUserProfileResponse } from "./user.model";
import type { UserRepository } from "./user.repository";

export interface UserService {
  getCurrentUser(user: AuthenticatedUser): Promise<UserProfileResponse>;
}

interface UserServiceDependencies {
  userRepository: UserRepository;
  leaderboardRepository: LeaderboardRepository;
  now: () => Date;
}

function createDefaultUser(authUser: AuthenticatedUser, now: Date): UserRecord {
  return {
    email: authUser.email,
    role: normalizeRole(authUser.role),
    name: authUser.name ?? null,
    uid: authUser.uid ?? null,
    department: authUser.department ?? null,
    rating: 0,
    score: 0,
    problemsSolved: 0,
    submissionCount: 0,
    acceptedSubmissionCount: 0,
    accuracy: 0,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    lastAcceptedAt: null,
  };
}

function mergeUser(existing: UserRecord, authUser: AuthenticatedUser, now: Date): UserRecord {
  return {
    ...existing,
    email: authUser.email,
    role: normalizeRole(authUser.role),
    name: authUser.name ?? existing.name,
    uid: authUser.uid ?? existing.uid,
    department: authUser.department ?? existing.department,
    score: existing.rating,
    lastLoginAt: now,
    updatedAt: now,
  };
}

export function createUserService(dependencies: UserServiceDependencies): UserService {
  return {
    async getCurrentUser(authUser) {
      const now = dependencies.now();
      const existingUser = await dependencies.userRepository.getByEmail(authUser.email);
      const user = existingUser ? mergeUser(existingUser, authUser, now) : createDefaultUser(authUser, now);

      await dependencies.userRepository.save(user);
      if (isRankedLeaderboardEntry(user)) {
        await dependencies.leaderboardRepository.save(buildLeaderboardEntryFromUser(user));
      }

      if (!isRankedLeaderboardEntry(user)) {
        return toUserProfileResponse(user, null);
      }

      const leaderboard = (await dependencies.leaderboardRepository.list()).filter(isRankedLeaderboardEntry);
      const rank = leaderboard.sort(compareLeaderboardEntries).findIndex((entry) => entry.email === user.email) + 1;

      return toUserProfileResponse(user, rank > 0 ? rank : null);
    },
  };
}
