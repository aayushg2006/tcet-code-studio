import type { UserRole } from "../../shared/types/auth";
import type { Difficulty, SubmissionStatus, SupportedLanguage } from "../../shared/types/domain";
import { toIsoString } from "../../shared/utils/date";

export interface SubmissionRecord {
  id: string;
  userEmail: string;
  userRole: UserRole;
  problemId: string;
  problemTitleSnapshot: string;
  problemDifficultySnapshot: Difficulty;
  code: string;
  language: SupportedLanguage;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  passedCount: number;
  totalCount: number;
  executionProvider: string;
  ratingAwarded: number;
  createdAt: Date;
  updatedAt: Date;
  judgedAt: Date | null;
  finalizationAppliedAt: Date | null;
}

export interface SubmissionResponse {
  id: string;
  userEmail: string;
  problemId: string;
  problemTitle: string;
  difficulty: Difficulty;
  language: SupportedLanguage;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  passedCount: number;
  totalCount: number;
  executionProvider: string;
  ratingAwarded: number;
  createdAt: string;
  updatedAt: string;
  judgedAt: string | null;
  code?: string;
}

export interface SubmissionRunResponse {
  problemId: string;
  language: SupportedLanguage;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  passedCount: number;
  totalCount: number;
  executionProvider: string;
  stdout?: string;
  stderr?: string;
}

export function toSubmissionResponse(submission: SubmissionRecord, includeCode = false): SubmissionResponse {
  return {
    id: submission.id,
    userEmail: submission.userEmail,
    problemId: submission.problemId,
    problemTitle: submission.problemTitleSnapshot,
    difficulty: submission.problemDifficultySnapshot,
    language: submission.language,
    status: submission.status,
    runtimeMs: submission.runtimeMs,
    memoryKb: submission.memoryKb,
    passedCount: submission.passedCount,
    totalCount: submission.totalCount,
    executionProvider: submission.executionProvider,
    ratingAwarded: submission.ratingAwarded,
    createdAt: toIsoString(submission.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(submission.updatedAt) ?? new Date(0).toISOString(),
    judgedAt: toIsoString(submission.judgedAt),
    ...(includeCode ? { code: submission.code } : {}),
  };
}
