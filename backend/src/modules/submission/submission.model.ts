import type { UserRole } from "../../shared/types/auth";
import type { Difficulty, ExecutableLanguage, SubmissionStatus } from "../../shared/types/domain";
import { toIsoString } from "../../shared/utils/date";

export interface SubmissionRecord {
  id: string;
  queueJobId: string | null;
  judge0Token: string | null;
  userEmail: string;
  userRole: UserRole;
  problemId: string;
  problemTitleSnapshot: string;
  problemDifficultySnapshot: Difficulty;
  code: string;
  language: ExecutableLanguage;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  passedCount: number;
  totalCount: number;
  executionProvider: string;
  ratingAwarded: number;
  stdout: string | null;
  stderr: string | null;
  createdAt: Date;
  updatedAt: Date;
  judgedAt: Date | null;
  finalizationAppliedAt: Date | null;
}

export interface SubmissionQueueReceipt {
  submission_id: string;
  status: "queued";
}

export interface SubmissionResponse {
  id: string;
  userEmail: string;
  userName: string | null;
  userUid: string | null;
  problemId: string;
  problemTitle: string;
  difficulty: Difficulty;
  language: ExecutableLanguage;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  passedCount: number;
  totalCount: number;
  executionProvider: string;
  ratingAwarded: number;
  stdout?: string | null;
  stderr?: string | null;
  createdAt: string;
  updatedAt: string;
  judgedAt: string | null;
  code?: string;
}

export interface SubmissionUserSnapshot {
  name: string | null;
  uid: string | null;
}

export interface SubmissionRunResponse {
  problemId: string;
  language: ExecutableLanguage;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  passedCount: number;
  totalCount: number;
  executionProvider: string;
  stdout?: string;
  stderr?: string;
}

export function toSubmissionResponse(
  submission: SubmissionRecord,
  includeCode = false,
  userSnapshot?: SubmissionUserSnapshot,
): SubmissionResponse {
  return {
    id: submission.id,
    userEmail: submission.userEmail,
    userName: userSnapshot?.name ?? null,
    userUid: userSnapshot?.uid ?? null,
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
    stdout: submission.stdout,
    stderr: submission.stderr,
    createdAt: toIsoString(submission.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(submission.updatedAt) ?? new Date(0).toISOString(),
    judgedAt: toIsoString(submission.judgedAt),
    ...(includeCode ? { code: submission.code } : {}),
  };
}
