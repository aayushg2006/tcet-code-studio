export type Difficulty = "Easy" | "Medium" | "Hard";
export type ProblemLifecycleState = "Draft" | "Published" | "Archived";
export type StudentProblemStatus = "solved" | "attempted" | "todo";
export type SupportedLanguage = "c" | "cpp" | "java" | "javascript" | "python" | "typescript";
export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "INTERNAL_ERROR";
