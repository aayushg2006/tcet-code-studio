import type { LeaderboardRepository } from "../leaderboard/leaderboard.repository";
import {
  buildLeaderboardEntryFromUser,
  compareLeaderboardEntries,
  isRankedLeaderboardEntry,
} from "../leaderboard/leaderboard.model";
import type { AuthenticatedUser } from "../../shared/types/auth";
import { AppError } from "../../shared/errors/app-error";
import { normalizeRole } from "../../shared/utils/normalize";
import type { UserRecord, UserProfileResponse } from "./user.model";
import { toUserProfileResponse } from "./user.model";
import type { UserRepository } from "./user.repository";

export interface UserService {
  getCurrentUser(user: AuthenticatedUser): Promise<UserProfileResponse>;
  getUserByEmail(email: string): Promise<UserProfileResponse>;
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

async function buildRankedProfileResponse(
  user: UserRecord,
  leaderboardRepository: LeaderboardRepository,
): Promise<UserProfileResponse> {
  if (!isRankedLeaderboardEntry(user)) {
    return toUserProfileResponse(user, null);
  }

  const leaderboard = (await leaderboardRepository.list()).filter(isRankedLeaderboardEntry);
  const rank = leaderboard.sort(compareLeaderboardEntries).findIndex((entry) => entry.email === user.email) + 1;

  return toUserProfileResponse(user, rank > 0 ? rank : null);
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

      return buildRankedProfileResponse(user, dependencies.leaderboardRepository);
    },

    async getUserByEmail(email) {
      const user = await dependencies.userRepository.getByEmail(email);
      if (!user) {
        throw new AppError(404, "User not found");
      }

      return buildRankedProfileResponse(user, dependencies.leaderboardRepository);
    },
  };
}
