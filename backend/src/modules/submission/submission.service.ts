import { randomUUID } from "node:crypto";
import { env } from "../../config/env";
import { wrapSubmissionCode } from "../../execution/code-wrapper";
import { DIFFICULTY_RATING_WEIGHTS } from "../../shared/constants/domain";
import { AppError } from "../../shared/errors/app-error";
import type { AuthenticatedUser } from "../../shared/types/auth";
import type { SupportedLanguage } from "../../shared/types/domain";
import { isFinalSubmissionStatus } from "../../shared/utils/normalize";
import { paginateArray, type PaginatedResult, type PaginationInput } from "../../shared/utils/pagination";
import type { ExecutionProvider, ExecutionResult } from "../../execution/execution-provider";
import type { SubmissionQueue } from "../../queue/submission-queue";
import { buildLeaderboardEntryFromUser } from "../leaderboard/leaderboard.model";
import type { LeaderboardRepository } from "../leaderboard/leaderboard.repository";
import type { ProblemRecord } from "../problem/problem.model";
import type { ProblemRepository } from "../problem/problem.repository";
import type { UserRecord } from "../user/user.model";
import type { UserRepository } from "../user/user.repository";
import type {
  SubmissionQueueReceipt,
  SubmissionRecord,
  SubmissionResponse,
  SubmissionRunResponse,
} from "./submission.model";
import { toSubmissionResponse } from "./submission.model";
import type { SubmissionListFilters, SubmissionRepository } from "./submission.repository";

export type { ExecutionProvider } from "../../execution/execution-provider";

export interface SubmissionService {
  runSubmission(user: AuthenticatedUser, input: SubmissionWriteInput): Promise<SubmissionRunResponse>;
  createSubmission(user: AuthenticatedUser, input: SubmissionWriteInput): Promise<SubmissionQueueReceipt>;
  processQueuedSubmission(submissionId: string, queueJobId?: string): Promise<SubmissionResponse>;
  listSubmissions(
    user: AuthenticatedUser,
    query: SubmissionListQuery,
  ): Promise<PaginatedResult<SubmissionResponse>>;
  getSubmissionById(user: AuthenticatedUser, submissionId: string): Promise<SubmissionResponse>;
}

interface SubmissionServiceDependencies {
  problemRepository: ProblemRepository;
  submissionRepository: SubmissionRepository;
  userRepository: UserRepository;
  leaderboardRepository: LeaderboardRepository;
  executionProvider: ExecutionProvider;
  submissionQueue: SubmissionQueue;
  now: () => Date;
}

export interface SubmissionWriteInput {
  problemId: string;
  code: string;
  language: SubmissionRecord["language"];
}

export interface SubmissionListQuery extends PaginationInput {
  problemId?: string;
  userEmail?: string;
  status?: SubmissionRecord["status"];
  language?: SupportedLanguage;
}

function calculateAccuracy(acceptedSubmissionCount: number, submissionCount: number): number {
  if (submissionCount === 0) {
    return 0;
  }

  return Math.round((acceptedSubmissionCount / submissionCount) * 10000) / 100;
}

async function ensureUser(
  userRepository: UserRepository,
  authUser: AuthenticatedUser,
  now: Date,
): Promise<UserRecord> {
  const existingUser = await userRepository.getByEmail(authUser.email);
  if (existingUser) {
    return existingUser;
  }

  const defaultUser: UserRecord = {
    email: authUser.email,
    role: authUser.role,
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

  await userRepository.save(defaultUser);
  return defaultUser;
}

function ensureVisibleProblem(problem: ProblemRecord | null, user: AuthenticatedUser): ProblemRecord {
  if (!problem) {
    throw new AppError(404, "Problem not found");
  }

  if (user.role === "STUDENT" && problem.lifecycleState !== "Published") {
    throw new AppError(404, "Problem not found");
  }

  return problem;
}

function buildSubmissionRunResponse(
  problemId: string,
  language: SubmissionRecord["language"],
  result: ExecutionResult,
): SubmissionRunResponse {
  return {
    problemId,
    language,
    status: result.status,
    runtimeMs: result.runtimeMs,
    memoryKb: result.memoryKb,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    executionProvider: result.provider,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function buildInternalErrorResult(totalCount: number, message: string): ExecutionResult {
  return {
    status: "INTERNAL_ERROR",
    runtimeMs: 0,
    memoryKb: 0,
    passedCount: 0,
    totalCount,
    provider: env.EXECUTION_PROVIDER,
    stderr: message,
  };
}

function calculateUserAggregateSnapshot(submissions: SubmissionRecord[]): {
  rating: number;
  problemsSolved: number;
  submissionCount: number;
  acceptedSubmissionCount: number;
  accuracy: number;
  lastAcceptedAt: Date | null;
} {
  const finalized = submissions.filter((submission) => isFinalSubmissionStatus(submission.status));
  const accepted = finalized.filter((submission) => submission.status === "ACCEPTED");
  const firstAcceptedByProblem = new Map<string, SubmissionRecord>();

  for (const submission of accepted.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())) {
    if (!firstAcceptedByProblem.has(submission.problemId)) {
      firstAcceptedByProblem.set(submission.problemId, submission);
    }
  }

  const rating = Array.from(firstAcceptedByProblem.values()).reduce((total, submission) => {
    return total + DIFFICULTY_RATING_WEIGHTS[submission.problemDifficultySnapshot];
  }, 0);

  const lastAcceptedAt =
    accepted.length > 0
      ? accepted.reduce((latest, submission) => {
          if (!latest) {
            return submission.judgedAt ?? submission.updatedAt;
          }

          const candidate = submission.judgedAt ?? submission.updatedAt;
          return candidate.getTime() > latest.getTime() ? candidate : latest;
        }, null as Date | null)
      : null;

  return {
    rating,
    problemsSolved: firstAcceptedByProblem.size,
    submissionCount: finalized.length,
    acceptedSubmissionCount: accepted.length,
    accuracy: calculateAccuracy(accepted.length, finalized.length),
    lastAcceptedAt,
  };
}

function calculateProblemAggregateSnapshot(submissions: SubmissionRecord[]): {
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
} {
  const finalized = submissions.filter((submission) => isFinalSubmissionStatus(submission.status));
  const acceptedSubmissions = finalized.filter((submission) => submission.status === "ACCEPTED").length;

  return {
    totalSubmissions: finalized.length,
    acceptedSubmissions,
    acceptanceRate: calculateAccuracy(acceptedSubmissions, finalized.length),
  };
}

async function syncUserAndLeaderboard(
  dependencies: SubmissionServiceDependencies,
  userEmail: string,
  now: Date,
): Promise<void> {
  const [user, userSubmissions] = await Promise.all([
    dependencies.userRepository.getByEmail(userEmail),
    dependencies.submissionRepository.list({ userEmail }),
  ]);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const aggregates = calculateUserAggregateSnapshot(userSubmissions);
  const updatedUser: UserRecord = {
    ...user,
    rating: aggregates.rating,
    score: aggregates.rating,
    problemsSolved: aggregates.problemsSolved,
    submissionCount: aggregates.submissionCount,
    acceptedSubmissionCount: aggregates.acceptedSubmissionCount,
    accuracy: aggregates.accuracy,
    lastAcceptedAt: aggregates.lastAcceptedAt,
    updatedAt: now,
  };

  await dependencies.userRepository.save(updatedUser);
  await dependencies.leaderboardRepository.save(buildLeaderboardEntryFromUser(updatedUser));
}

async function syncProblemAggregates(
  dependencies: SubmissionServiceDependencies,
  problemId: string,
  now: Date,
): Promise<void> {
  const [problem, submissions] = await Promise.all([
    dependencies.problemRepository.getById(problemId),
    dependencies.submissionRepository.list({ problemId }),
  ]);

  if (!problem) {
    throw new AppError(404, "Problem not found");
  }

  const aggregates = calculateProblemAggregateSnapshot(submissions);
  await dependencies.problemRepository.save({
    ...problem,
    totalSubmissions: aggregates.totalSubmissions,
    acceptedSubmissions: aggregates.acceptedSubmissions,
    acceptanceRate: aggregates.acceptanceRate,
    updatedAt: now,
  });
}

async function finalizeSubmission(
  dependencies: SubmissionServiceDependencies,
  submissionId: string,
  result: ExecutionResult,
): Promise<SubmissionRecord> {
  const existingSubmission = await dependencies.submissionRepository.getById(submissionId);
  if (!existingSubmission) {
    throw new AppError(404, "Submission not found");
  }

  if (existingSubmission.finalizationAppliedAt && isFinalSubmissionStatus(existingSubmission.status)) {
    return existingSubmission;
  }

  const now = dependencies.now();
  let updatedSubmission: SubmissionRecord = {
    ...existingSubmission,
    status: result.status,
    runtimeMs: result.runtimeMs,
    memoryKb: result.memoryKb,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    executionProvider: result.provider,
    stdout: result.stdout ?? existingSubmission.stdout,
    stderr: result.stderr ?? existingSubmission.stderr,
    judgedAt: now,
    finalizationAppliedAt: now,
    updatedAt: now,
  };

  await dependencies.submissionRepository.save(updatedSubmission);

  const userSubmissions = await dependencies.submissionRepository.list({ userEmail: updatedSubmission.userEmail });
  const firstAcceptedByProblem = new Map<string, SubmissionRecord>();

  for (const submission of userSubmissions
    .filter((submission) => submission.status === "ACCEPTED")
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())) {
    if (!firstAcceptedByProblem.has(submission.problemId)) {
      firstAcceptedByProblem.set(submission.problemId, submission);
    }
  }

  const awardedSubmission = firstAcceptedByProblem.get(updatedSubmission.problemId);
  const ratingAwarded =
    awardedSubmission?.id === updatedSubmission.id && updatedSubmission.status === "ACCEPTED"
      ? DIFFICULTY_RATING_WEIGHTS[updatedSubmission.problemDifficultySnapshot]
      : 0;

  if (updatedSubmission.ratingAwarded !== ratingAwarded) {
    updatedSubmission = {
      ...updatedSubmission,
      ratingAwarded,
      updatedAt: dependencies.now(),
    };
    await dependencies.submissionRepository.save(updatedSubmission);
  }

  await syncProblemAggregates(dependencies, updatedSubmission.problemId, now);
  await syncUserAndLeaderboard(dependencies, updatedSubmission.userEmail, now);

  return updatedSubmission;
}

async function markSubmissionAsInternalError(
  dependencies: SubmissionServiceDependencies,
  submissionId: string,
  message: string,
): Promise<SubmissionRecord | null> {
  const submission = await dependencies.submissionRepository.getById(submissionId);
  if (!submission) {
    return null;
  }

  if (submission.finalizationAppliedAt && isFinalSubmissionStatus(submission.status)) {
    return submission;
  }

  return finalizeSubmission(
    dependencies,
    submissionId,
    buildInternalErrorResult(submission.totalCount, message),
  );
}

export function createSubmissionService(dependencies: SubmissionServiceDependencies): SubmissionService {
  return {
    async runSubmission(user, input) {
      const problem = ensureVisibleProblem(await dependencies.problemRepository.getById(input.problemId), user);
      const result = await dependencies.executionProvider.executeRun({
        code: wrapSubmissionCode(input.language, input.code),
        language: input.language,
        testCases: problem.sampleTestCases,
        problemId: problem.id,
        timeLimitSeconds: problem.timeLimitSeconds,
        memoryLimitMb: problem.memoryLimitMb,
      });

      return buildSubmissionRunResponse(problem.id, input.language, result);
    },

    async createSubmission(user, input) {
      const now = dependencies.now();
      const problem = ensureVisibleProblem(await dependencies.problemRepository.getById(input.problemId), user);

      await ensureUser(dependencies.userRepository, user, now);

      const submission: SubmissionRecord = {
        id: `submission_${randomUUID()}`,
        queueJobId: null,
        judge0Token: null,
        userEmail: user.email,
        userRole: user.role,
        problemId: problem.id,
        problemTitleSnapshot: problem.title,
        problemDifficultySnapshot: problem.difficulty,
        code: input.code,
        language: input.language,
        status: "QUEUED",
        runtimeMs: 0,
        memoryKb: 0,
        passedCount: 0,
        totalCount: problem.sampleTestCases.length + problem.hiddenTestCases.length,
        executionProvider: env.EXECUTION_PROVIDER,
        ratingAwarded: 0,
        stdout: null,
        stderr: null,
        createdAt: now,
        updatedAt: now,
        judgedAt: null,
        finalizationAppliedAt: null,
      };

      await dependencies.submissionRepository.create(submission);

      try {
        const queueJobId = await dependencies.submissionQueue.enqueue(submission.id);
        await dependencies.submissionRepository.save({
          ...submission,
          queueJobId,
          updatedAt: dependencies.now(),
        });

        return {
          submission_id: submission.id,
          status: "queued",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to enqueue submission.";
        await markSubmissionAsInternalError(dependencies, submission.id, message);
        throw new AppError(500, "Failed to queue submission");
      }
    },

    async processQueuedSubmission(submissionId, queueJobId) {
      const existingSubmission = await dependencies.submissionRepository.getById(submissionId);
      if (!existingSubmission) {
        throw new AppError(404, "Submission not found");
      }

      if (existingSubmission.finalizationAppliedAt && isFinalSubmissionStatus(existingSubmission.status)) {
        return toSubmissionResponse(existingSubmission, true);
      }

      const problem = await dependencies.problemRepository.getById(existingSubmission.problemId);
      if (!problem) {
        throw new AppError(404, "Problem not found");
      }

      const runningSubmission: SubmissionRecord = {
        ...existingSubmission,
        queueJobId: queueJobId || existingSubmission.queueJobId,
        status: "RUNNING",
        stderr: null,
        updatedAt: dependencies.now(),
      };

      await dependencies.submissionRepository.save(runningSubmission);

      try {
        const result = await dependencies.executionProvider.executeSubmission({
          code: wrapSubmissionCode(runningSubmission.language, runningSubmission.code),
          language: runningSubmission.language,
          testCases: [...problem.sampleTestCases, ...problem.hiddenTestCases],
          problemId: problem.id,
          timeLimitSeconds: problem.timeLimitSeconds,
          memoryLimitMb: problem.memoryLimitMb,
        });

        const finalizedSubmission = await finalizeSubmission(dependencies, runningSubmission.id, result);
        return toSubmissionResponse(finalizedSubmission, true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Background submission execution failed.";
        const failedSubmission = await markSubmissionAsInternalError(dependencies, runningSubmission.id, message);
        if (!failedSubmission) {
          throw error;
        }

        return toSubmissionResponse(failedSubmission, true);
      }
    },

    async listSubmissions(user, query) {
      const filters: SubmissionListFilters = {
        problemId: query.problemId,
        status: query.status,
        language: query.language,
        userEmail: user.role === "FACULTY" ? query.userEmail : user.email,
      };
      const submissions = await dependencies.submissionRepository.list(filters);

      const responses = submissions
        .filter((submission) => (user.role === "FACULTY" ? true : submission.userEmail === user.email))
        .map((submission) => toSubmissionResponse(submission));

      return paginateArray(responses, query);
    },

    async getSubmissionById(user, submissionId) {
      const submission = await dependencies.submissionRepository.getById(submissionId);
      if (!submission) {
        throw new AppError(404, "Submission not found");
      }

      if (user.role !== "FACULTY" && submission.userEmail !== user.email) {
        throw new AppError(403, "You are not allowed to view this submission");
      }

      return toSubmissionResponse(submission, true);
    },
  };
}
