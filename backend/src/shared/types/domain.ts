export type Difficulty = "Easy" | "Medium" | "Hard";
export type ProblemLifecycleState = "Draft" | "Published" | "Archived";
export type StudentProblemStatus = "solved" | "attempted" | "todo";
export type SupportedLanguage =
  | "c"
  | "cpp"
  | "java"
  | "javascript"
  | "python"
  | "ruby"
  | "arduino"
  | "go"
  | "rust"
  | "csharp"
  | "php"
  | "vanilla"
  | "react"
  | "typescript"
  | "html"
  | "css"
  | "assembly8086"
  | "kotlin"
  | "swift"
  | "dart"
  | "scala"
  | "elixir"
  | "erlang"
  | "racket";
export type EditorOnlyLanguage = "react" | "html" | "css";
export type ExecutableLanguage = Exclude<SupportedLanguage, EditorOnlyLanguage>;
export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "INTERNAL_ERROR";
