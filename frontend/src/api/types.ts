export type UserRole = "STUDENT" | "FACULTY";
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

export type EditorOnlyLanguage = "vanilla" | "react" | "html" | "css";
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

export interface PageInfo {
  nextCursor: string | null;
  pageSize: number;
  totalCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface UserProfile {
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

export interface UserEnvelope {
  user: UserProfile;
}

export interface ProblemTestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface StudentProblemSummary {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  userStatus: StudentProblemStatus;
  submissions: number;
  totalSubmissions: number;
  acceptance: number;
  acceptanceRate: number;
  timeLimit: string;
  timeLimitSeconds: number;
  memoryLimit: string;
  memoryLimitMb: number;
}

export interface StudentProblemDetail extends StudentProblemSummary {
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: Array<ProblemTestCase & { hidden: false }>;
  sampleTestCases: ProblemTestCase[];
}

export interface ManageProblemSummary {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  lifecycleState: ProblemLifecycleState;
  totalSubmissions: number;
  acceptanceRate: number;
  updatedAt: string;
}

export interface ManageProblemDetail extends ManageProblemSummary {
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  timeLimitSeconds: number;
  memoryLimitMb: number;
  createdBy: string;
  createdByRole: UserRole;
  sampleTestCases: ProblemTestCase[];
  hiddenTestCases: ProblemTestCase[];
  createdAt: string;
}

export interface ProblemEnvelope<T> {
  problem: T;
}

export interface SubmissionResult {
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

export interface RunResultEnvelope {
  result: SubmissionResult;
}

export interface Submission {
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

export interface SubmissionEnvelope {
  submission: Submission;
}

export interface SubmissionQueueReceipt {
  submission_id: string;
  status: "queued";
}

export interface LeaderboardItem {
  rank: number;
  email: string;
  role: UserRole;
  name: string | null;
  uid: string | null;
  rating: number;
  score: number;
  problemsSolved: number;
  submissionCount: number;
  acceptedSubmissionCount: number;
  accuracy: number;
  updatedAt: string;
  lastAcceptedAt: string | null;
}

export interface SubmissionWritePayload {
  problemId: string;
  code: string;
  language: ExecutableLanguage;
}

export interface ProblemWritePayload {
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  difficulty: Difficulty;
  tags: string[];
  timeLimitSeconds: number;
  memoryLimitMb: number;
  lifecycleState: ProblemLifecycleState;
  sampleTestCases: ProblemTestCase[];
  hiddenTestCases: ProblemTestCase[];
}

export type ProblemUpdatePayload = Partial<ProblemWritePayload>;

export interface ProblemEditorData {
  title: string;
  difficulty: Difficulty;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  timeLimitSeconds: number;
  memoryLimitMb: number;
  sampleTestCases: ProblemTestCase[];
  hiddenTestCases: ProblemTestCase[];
  lifecycleState?: ProblemLifecycleState;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  loginUrl?: string;
  details?: unknown;
}
