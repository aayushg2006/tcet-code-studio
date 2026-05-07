import { DIFFICULTIES, FINAL_SUBMISSION_STATUSES, PROBLEM_LIFECYCLE_STATES, SUPPORTED_LANGUAGES } from "../constants/domain";
import type { Difficulty, ProblemLifecycleState, SubmissionStatus, SupportedLanguage } from "../types/domain";
import type { UserRole } from "../types/auth";

export function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function normalizeRole(value: unknown): UserRole {
  return typeof value === "string" && value.toUpperCase() === "FACULTY" ? "FACULTY" : "STUDENT";
}

export function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value === "string") {
    const candidate = value.trim().toLowerCase();
    if (candidate === "easy") {
      return "Easy";
    }
    if (candidate === "medium") {
      return "Medium";
    }
    if (candidate === "hard") {
      return "Hard";
    }
  }

  return DIFFICULTIES[0];
}

export function normalizeProblemLifecycleState(value: unknown): ProblemLifecycleState {
  if (typeof value === "string") {
    const candidate = value.trim().toLowerCase();
    if (candidate === "published") {
      return "Published";
    }
    if (candidate === "archived") {
      return "Archived";
    }
    if (candidate === "draft") {
      return "Draft";
    }
  }

  return PROBLEM_LIFECYCLE_STATES[0];
}

export function normalizeSupportedLanguage(value: unknown): SupportedLanguage {
  if (typeof value === "string") {
    const candidate = value.trim().toLowerCase();
    if (candidate === "c++" || candidate === "cpp") {
      return "cpp";
    }
    if (candidate === "js" || candidate === "javascript") {
      return "javascript";
    }
    if (candidate === "ts" || candidate === "typescript") {
      return "typescript";
    }
    if (candidate === "py" || candidate === "python") {
      return "python";
    }
    if (SUPPORTED_LANGUAGES.includes(candidate as SupportedLanguage)) {
      return candidate as SupportedLanguage;
    }
  }

  return "cpp";
}

export function normalizeSubmissionStatus(value: unknown): SubmissionStatus {
  if (typeof value === "string") {
    const candidate = value.trim().toUpperCase();
    if (candidate === "ACCEPTED") {
      return "ACCEPTED";
    }
    if (candidate === "WRONG_ANSWER" || candidate === "WRONG ANSWER") {
      return "WRONG_ANSWER";
    }
    if (candidate === "TIME_LIMIT_EXCEEDED" || candidate === "TLE") {
      return "TIME_LIMIT_EXCEEDED";
    }
    if (candidate === "RUNTIME_ERROR") {
      return "RUNTIME_ERROR";
    }
    if (candidate === "COMPILATION_ERROR") {
      return "COMPILATION_ERROR";
    }
    if (candidate === "RUNNING") {
      return "RUNNING";
    }
    if (candidate === "INTERNAL_ERROR") {
      return "INTERNAL_ERROR";
    }
    if (candidate === "QUEUED") {
      return "QUEUED";
    }
  }

  return "QUEUED";
}

export function isFinalSubmissionStatus(status: SubmissionStatus): boolean {
  return FINAL_SUBMISSION_STATUSES.includes(status);
}
