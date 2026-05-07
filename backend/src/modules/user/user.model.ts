import type { UserRole } from "../../shared/types/auth";
import { toIsoString } from "../../shared/utils/date";

export interface UserRecord {
  email: string;
  role: UserRole;
  name: string | null;
  uid: string | null;
  department: string | null;
  rating: number;
  score: number;
  problemsSolved: number;
  submissionCount: number;
  acceptedSubmissionCount: number;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  lastAcceptedAt: Date | null;
}

export interface UserProfileResponse {
  email: string;
  role: UserRole;
  name: string | null;
  uid: string | null;
  department: string | null;
  rating: number;
  score: number;
  problemsSolved: number;
  submissionCount: number;
  acceptedSubmissionCount: number;
  accuracy: number;
  rank: number | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastAcceptedAt: string | null;
}

export function toUserProfileResponse(user: UserRecord, rank: number | null): UserProfileResponse {
  return {
    email: user.email,
    role: user.role,
    name: user.name,
    uid: user.uid,
    department: user.department,
    rating: user.rating,
    score: user.rating,
    problemsSolved: user.problemsSolved,
    submissionCount: user.submissionCount,
    acceptedSubmissionCount: user.acceptedSubmissionCount,
    accuracy: user.accuracy,
    rank,
    createdAt: toIsoString(user.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(user.updatedAt) ?? new Date(0).toISOString(),
    lastLoginAt: toIsoString(user.lastLoginAt),
    lastAcceptedAt: toIsoString(user.lastAcceptedAt),
  };
}
