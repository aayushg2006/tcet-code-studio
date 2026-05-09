import { apiRequest } from "@/api/client";
import type {
  LeaderboardItem,
  ManageProblemDetail,
  ManageProblemSummary,
  PaginatedResponse,
  ProblemEnvelope,
  ProblemLifecycleState,
  ProblemUpdatePayload,
  ProblemWritePayload,
  RunResultEnvelope,
  StudentProblemDetail,
  StudentProblemSummary,
  Submission,
  SubmissionEnvelope,
  SubmissionQueueReceipt,
  SubmissionStatus,
  SubmissionWritePayload,
  SupportedLanguage,
  UserEnvelope,
} from "@/api/types";

export type PaginationQuery = {
  cursor?: string;
  pageSize?: number;
};

export type StudentProblemsQuery = PaginationQuery & {
  search?: string;
  difficulty?: string;
  tag?: string;
};

export type ManageProblemsQuery = StudentProblemsQuery & {
  lifecycleState?: ProblemLifecycleState;
};

export type SubmissionsQuery = PaginationQuery & {
  problemId?: string;
  userEmail?: string;
  status?: SubmissionStatus;
  language?: SupportedLanguage;
};

export const userApi = {
  me: (pathname?: string) => apiRequest<UserEnvelope>("/api/users/me", { pathname }),
};

export const problemsApi = {
  listStudent: (query: StudentProblemsQuery = {}, pathname?: string) =>
    apiRequest<PaginatedResponse<StudentProblemSummary>>("/api/problems", { query, pathname }),
  getStudentDetail: (problemId: string, pathname?: string) =>
    apiRequest<ProblemEnvelope<StudentProblemDetail>>(`/api/problems/${problemId}`, { pathname }),
  listManage: (query: ManageProblemsQuery = {}, pathname?: string) =>
    apiRequest<PaginatedResponse<ManageProblemSummary>>("/api/problems/manage", { query, pathname }),
  getManageDetail: (problemId: string, pathname?: string) =>
    apiRequest<ProblemEnvelope<ManageProblemDetail>>(`/api/problems/manage/${problemId}`, { pathname }),
  create: (payload: ProblemWritePayload, pathname?: string) =>
    apiRequest<ProblemEnvelope<ManageProblemDetail>>("/api/problems", {
      method: "POST",
      body: payload,
      pathname,
    }),
  update: (problemId: string, payload: ProblemUpdatePayload, pathname?: string) =>
    apiRequest<ProblemEnvelope<ManageProblemDetail>>(`/api/problems/${problemId}`, {
      method: "PATCH",
      body: payload,
      pathname,
    }),
  updateState: (problemId: string, lifecycleState: ProblemLifecycleState, pathname?: string) =>
    apiRequest<ProblemEnvelope<ManageProblemDetail>>(`/api/problems/${problemId}/state`, {
      method: "PATCH",
      body: { lifecycleState },
      pathname,
    }),
};

export const submissionsApi = {
  run: (payload: SubmissionWritePayload, pathname?: string) =>
    apiRequest<RunResultEnvelope>("/api/submissions/run", {
      method: "POST",
      body: payload,
      pathname,
    }),
  create: (payload: SubmissionWritePayload, pathname?: string) =>
    apiRequest<SubmissionQueueReceipt>("/api/submissions", {
      method: "POST",
      body: payload,
      pathname,
    }),
  list: (query: SubmissionsQuery = {}, pathname?: string) =>
    apiRequest<PaginatedResponse<Submission>>("/api/submissions", {
      query,
      pathname,
    }),
  getById: (submissionId: string, pathname?: string) =>
    apiRequest<SubmissionEnvelope>(`/api/submissions/${submissionId}`, {
      pathname,
    }),
};

export const leaderboardApi = {
  list: (query: PaginationQuery = {}, pathname?: string) =>
    apiRequest<PaginatedResponse<LeaderboardItem>>("/api/leaderboard", {
      query,
      pathname,
    }),
  exportCsv: (pathname?: string) =>
    apiRequest<string>("/api/leaderboard/export", {
      pathname,
      responseType: "text",
    }),
};
