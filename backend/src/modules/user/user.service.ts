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

export interface UpdateCurrentUserProfileInput {
  rollNumber: string;
  department: string;
  semester: number;
  linkedInUrl: string | null;
  githubUrl: string | null;
}

export interface UserService {
  getCurrentUser(user: AuthenticatedUser): Promise<UserProfileResponse>;
  getUserByEmail(email: string): Promise<UserProfileResponse>;
  updateCurrentUserProfile(
    user: AuthenticatedUser,
    input: UpdateCurrentUserProfileInput,
  ): Promise<UserProfileResponse>;
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
    isProfileComplete: false,
    rollNumber: null,
    department: authUser.department ?? null,
    semester: null,
    linkedInUrl: null,
    githubUrl: null,
    skills: [],
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
    department: existing.department ?? authUser.department ?? null,
    isProfileComplete: existing.isProfileComplete,
    rollNumber: existing.rollNumber,
    semester: existing.semester,
    linkedInUrl: existing.linkedInUrl,
    githubUrl: existing.githubUrl,
    skills: existing.skills,
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

    async updateCurrentUserProfile(authUser, input) {
      const now = dependencies.now();
      const existingUser = await dependencies.userRepository.getByEmail(authUser.email);
      const baseUser = existingUser ? mergeUser(existingUser, authUser, now) : createDefaultUser(authUser, now);

      const updatedUser: UserRecord = {
        ...baseUser,
        isProfileComplete: true,
        rollNumber: input.rollNumber,
        department: input.department,
        semester: input.semester,
        linkedInUrl: input.linkedInUrl,
        githubUrl: input.githubUrl,
        updatedAt: now,
      };

      await dependencies.userRepository.save(updatedUser);
      if (isRankedLeaderboardEntry(updatedUser)) {
        await dependencies.leaderboardRepository.save(buildLeaderboardEntryFromUser(updatedUser));
      }

      return buildRankedProfileResponse(updatedUser, dependencies.leaderboardRepository);
    },
  };
}
