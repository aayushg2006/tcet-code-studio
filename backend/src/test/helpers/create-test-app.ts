import { createApp } from "../../app";
import { authMiddleware } from "../../middleware/auth";
import { createLeaderboardService } from "../../modules/leaderboard/leaderboard.service";
import { createProblemService } from "../../modules/problem/problem.service";
import { createSubmissionService } from "../../modules/submission/submission.service";
import { createUserService } from "../../modules/user/user.service";
import { StubExecutionProvider } from "../../execution/stub-execution-provider";
import type { ApplicationDependencies } from "../../bootstrap/dependencies";
import {
  InMemoryLeaderboardRepository,
  InMemoryProblemRepository,
  InMemorySubmissionRepository,
  InMemoryUserRepository,
} from "./in-memory-repositories";

export function createTestApp() {
  const userRepository = new InMemoryUserRepository();
  const problemRepository = new InMemoryProblemRepository();
  const submissionRepository = new InMemorySubmissionRepository();
  const leaderboardRepository = new InMemoryLeaderboardRepository();
  let tick = 0;

  const now = () => {
    tick += 1;
    return new Date(Date.UTC(2026, 4, 7, 0, 0, tick));
  };

  const dependencies: ApplicationDependencies = {
    authMiddleware,
    userService: createUserService({
      userRepository,
      leaderboardRepository,
      now,
    }),
    problemService: createProblemService({
      problemRepository,
      submissionRepository,
      now,
    }),
    submissionService: createSubmissionService({
      problemRepository,
      submissionRepository,
      userRepository,
      leaderboardRepository,
      executionProvider: new StubExecutionProvider(),
      now,
    }),
    leaderboardService: createLeaderboardService({
      leaderboardRepository,
    }),
  };

  return {
    app: createApp(dependencies),
    repositories: {
      userRepository,
      problemRepository,
      submissionRepository,
      leaderboardRepository,
    },
  };
}
