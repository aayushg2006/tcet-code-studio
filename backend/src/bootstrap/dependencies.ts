import type { RequestHandler } from "express";
import { env } from "../config/env";
import { db } from "../firebase";
import { Judge0ExecutionProvider } from "../execution/judge0-execution-provider";
import { authMiddleware } from "../middleware/auth";
import {
  FirestoreLeaderboardRepository,
  type LeaderboardRepository,
} from "../modules/leaderboard/leaderboard.repository";
import { createLeaderboardService, type LeaderboardService } from "../modules/leaderboard/leaderboard.service";
import { FirestoreProblemRepository, type ProblemRepository } from "../modules/problem/problem.repository";
import { createProblemService, type ProblemService } from "../modules/problem/problem.service";
import {
  FirestoreSubmissionRepository,
  type SubmissionRepository,
} from "../modules/submission/submission.repository";
import {
  createSubmissionService,
  type ExecutionProvider,
  type SubmissionService,
} from "../modules/submission/submission.service";
import { FirestoreUserRepository, type UserRepository } from "../modules/user/user.repository";
import { createUserService, type UserService } from "../modules/user/user.service";

export interface RepositoryBundle {
  userRepository: UserRepository;
  problemRepository: ProblemRepository;
  submissionRepository: SubmissionRepository;
  leaderboardRepository: LeaderboardRepository;
}

export interface ServiceBundle {
  userService: UserService;
  problemService: ProblemService;
  submissionService: SubmissionService;
  leaderboardService: LeaderboardService;
}

export interface ApplicationDependencies extends ServiceBundle {
  authMiddleware: RequestHandler;
  databaseHealthcheck?: () => Promise<void>;
}

export interface DependencyOverrides {
  authMiddleware?: RequestHandler;
  executionProvider?: ExecutionProvider;
  repositories?: Partial<RepositoryBundle>;
  now?: () => Date;
}

function createRepositories(overrides?: Partial<RepositoryBundle>): RepositoryBundle {
  return {
    userRepository: overrides?.userRepository ?? new FirestoreUserRepository(db),
    problemRepository: overrides?.problemRepository ?? new FirestoreProblemRepository(db),
    submissionRepository: overrides?.submissionRepository ?? new FirestoreSubmissionRepository(db),
    leaderboardRepository: overrides?.leaderboardRepository ?? new FirestoreLeaderboardRepository(db),
  };
}

export function createApplicationDependencies(overrides: DependencyOverrides = {}): ApplicationDependencies {
  const repositories = createRepositories(overrides.repositories);
  const now = overrides.now ?? (() => new Date());

  const userService = createUserService({
    userRepository: repositories.userRepository,
    leaderboardRepository: repositories.leaderboardRepository,
    now,
  });

  const problemService = createProblemService({
    problemRepository: repositories.problemRepository,
    submissionRepository: repositories.submissionRepository,
    now,
  });

  const submissionService = createSubmissionService({
    problemRepository: repositories.problemRepository,
    submissionRepository: repositories.submissionRepository,
    userRepository: repositories.userRepository,
    leaderboardRepository: repositories.leaderboardRepository,
    executionProvider: overrides.executionProvider ?? new Judge0ExecutionProvider(),
    now,
  });

  const leaderboardService = createLeaderboardService({
    leaderboardRepository: repositories.leaderboardRepository,
  });

  return {
    authMiddleware: overrides.authMiddleware ?? authMiddleware,
    databaseHealthcheck: async () => {
      await db.collection(env.FIRESTORE_TEST_COLLECTION).doc("demo").set({
        message: "Firebase connected",
        time: new Date(),
      });
    },
    userService,
    problemService,
    submissionService,
    leaderboardService,
  };
}
