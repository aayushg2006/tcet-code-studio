import { toIsoString } from "../../shared/utils/date";
import type { UserRole } from "../../shared/types/auth";
import type { UserRecord } from "../user/user.model";

export interface LeaderboardEntry {
  email: string;
  role: UserRole;
  name: string | null;
  uid: string | null;
  rating: number;
  score: number;
  problemsSolved: number;
  submissionCount: number;
  acceptedSubmissionCount: number;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
  lastAcceptedAt: Date | null;
}

export interface LeaderboardListItem {
  rank: number;
  email: string;
  role: UserRole;
  name: string | null;
  uid: string | null;
  rating: number;
  score: number;
  problemsSolved: number;
  submissionCount: number;
  acceptedSubmissionCount: number;
  accuracy: number;
  updatedAt: string;
  lastAcceptedAt: string | null;
}

export function buildLeaderboardEntryFromUser(user: UserRecord): LeaderboardEntry {
  return {
    email: user.email,
    role: user.role,
    name: user.name,
    uid: user.uid,
    rating: user.rating,
    score: user.rating,
    problemsSolved: user.problemsSolved,
    submissionCount: user.submissionCount,
    acceptedSubmissionCount: user.acceptedSubmissionCount,
    accuracy: user.accuracy,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastAcceptedAt: user.lastAcceptedAt,
  };
}

export function isRankedLeaderboardEntry(entry: Pick<LeaderboardEntry, "role">): boolean {
  return entry.role === "STUDENT";
}

export function compareLeaderboardEntries(left: LeaderboardEntry, right: LeaderboardEntry): number {
  if (right.rating !== left.rating) {
    return right.rating - left.rating;
  }

  if (right.accuracy !== left.accuracy) {
    return right.accuracy - left.accuracy;
  }

  if (right.problemsSolved !== left.problemsSolved) {
    return right.problemsSolved - left.problemsSolved;
  }

  return left.email.localeCompare(right.email);
}

export function toLeaderboardListItem(entry: LeaderboardEntry, rank: number): LeaderboardListItem {
  return {
    rank,
    email: entry.email,
    role: entry.role,
    name: entry.name,
    uid: entry.uid,
    rating: entry.rating,
    score: entry.rating,
    problemsSolved: entry.problemsSolved,
    submissionCount: entry.submissionCount,
    acceptedSubmissionCount: entry.acceptedSubmissionCount,
    accuracy: entry.accuracy,
    updatedAt: toIsoString(entry.updatedAt) ?? new Date(0).toISOString(),
    lastAcceptedAt: toIsoString(entry.lastAcceptedAt),
  };
}
