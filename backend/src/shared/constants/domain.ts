import { env } from "../../config/env";
import type { Difficulty, ProblemLifecycleState, SubmissionStatus, SupportedLanguage } from "../types/domain";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["c", "cpp", "java", "javascript", "python", "typescript"];
export const PROBLEM_LIFECYCLE_STATES: ProblemLifecycleState[] = ["Draft", "Published", "Archived"];
export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
export const FINAL_SUBMISSION_STATUSES: SubmissionStatus[] = [
  "ACCEPTED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "COMPILATION_ERROR",
  "INTERNAL_ERROR",
];
export const DIFFICULTY_RATING_WEIGHTS: Record<Difficulty, number> = {
  Easy: env.RATING_POINTS_EASY,
  Medium: env.RATING_POINTS_MEDIUM,
  Hard: env.RATING_POINTS_HARD,
};
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PROBLEM_TIME_LIMIT_SECONDS = env.DEFAULT_PROBLEM_TIME_LIMIT_SECONDS;
export const DEFAULT_PROBLEM_MEMORY_LIMIT_MB = env.DEFAULT_PROBLEM_MEMORY_LIMIT_MB;
