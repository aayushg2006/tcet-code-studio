import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Send,
  ChevronLeft,
  FileCode2,
  Settings,
  RotateCcw,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DifficultyBadge, StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import { submissionsApi, problemsApi } from "@/api/services";
import {
  EXECUTABLE_LANGUAGES,
  toLanguageLabel,
  toStatusLabel,
} from "@/api/mappers";
import type {
  ExecutableLanguage,
  Submission,
  SubmissionResult,
  SubmissionStatus,
} from "@/api/types";
import { isSubmissionPending, pollSubmissionUntilComplete } from "./submissionPolling";

const STARTER_TEMPLATES: Partial<Record<ExecutableLanguage, string>> = {
  cpp: `// Solution.cpp
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // Read from cin if needed. The platform injects main() for Solution classes.
    vector<int> solve() {
        return {};
    }
};
`,
  java: `// Solution.java
import java.util.*;

class Solution {
    // Read from System.in if needed. The platform injects Main for Solution classes.
    public List<Integer> solve() {
        return new ArrayList<>();
    }
}
`,
  python: `# Solution.py
class Solution:
    # Read from stdin if needed. The platform injects the execution entrypoint.
    def solve(self):
        return []
`,
  javascript: `// Solution.js
class Solution {
  // Read from stdin if needed. The platform injects the execution entrypoint.
  solve() {
    return [];
  }
}
`,
};

const FILE_EXTENSIONS: Partial<Record<ExecutableLanguage, string>> = {
  cpp: "cpp",
  java: "java",
  python: "py",
  javascript: "js",
};

function getStarterCode(language: ExecutableLanguage): string {
  return (
    STARTER_TEMPLATES[language] ??
    `// Solution.${FILE_EXTENSIONS[language] ?? language}
// Start coding here.
`
  );
}

function getSolutionFilename(language: ExecutableLanguage): string {
  return `Solution.${FILE_EXTENSIONS[language] ?? language}`;
}

function formatStatus(status: SubmissionStatus): string {
  return toStatusLabel(status);
}

function formatRelativeTime(isoDate: string): string {
  const created = new Date(isoDate).getTime();
  const diffMs = Date.now() - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d ago`;
}

export default function ProblemDetail() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();

  const [code, setCode] = useState(() => getStarterCode("cpp"));
  const [language, setLanguage] = useState<ExecutableLanguage>("cpp");
  const [tab, setTab] = useState<"tests" | "console" | "subs">("tests");
  const [runResult, setRunResult] = useState<SubmissionResult | null>(null);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);
  const [pendingSubmissionStatus, setPendingSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const pollingAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pollingAbortRef.current?.abort();
      pollingAbortRef.current = null;
    };
  }, []);

  const { data: problemEnvelope, isLoading: problemLoading, isError: problemError, error: problemErrorObj } = useQuery({
    queryKey: ["student-problem-detail", id],
    queryFn: () => problemsApi.getStudentDetail(id),
    enabled: Boolean(id),
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["student-problem-submissions", id],
    queryFn: () => submissionsApi.list({ problemId: id, pageSize: 25 }),
    enabled: Boolean(id),
  });

  const submissions = useMemo(
    () => [...(submissionsData?.items ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [submissionsData?.items],
  );

  const invalidateSubmissionViews = () => {
    queryClient.invalidateQueries({ queryKey: ["student-problem-submissions", id] });
    queryClient.invalidateQueries({ queryKey: ["student-profile"] });
    queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["student-leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["student-problems"] });
  };

  const beginSubmissionPolling = async (submissionId: string) => {
    pollingAbortRef.current?.abort();
    const controller = new AbortController();
    pollingAbortRef.current = controller;
    setPendingSubmissionId(submissionId);
    setPendingSubmissionStatus("QUEUED");

    try {
      const finalSubmission = await pollSubmissionUntilComplete(
        submissionId,
        async (currentSubmissionId) => {
          const response = await submissionsApi.getById(currentSubmissionId);
          return response.submission;
        },
        {
          intervalMs: 1_500,
          timeoutMs: 120_000,
          signal: controller.signal,
          onUpdate: (submission) => {
            setPendingSubmissionStatus(submission.status);
            setSubmitResult(submission);
          },
        },
      );

      setSubmitResult(finalSubmission);
      setRunResult(null);
      setTab("subs");
      invalidateSubmissionViews();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error((error as Error).message || "Polling failed");
    } finally {
      if (pollingAbortRef.current === controller) {
        pollingAbortRef.current = null;
        setPendingSubmissionId(null);
        setPendingSubmissionStatus(null);
      }
    }
  };

  const runMutation = useMutation({
    mutationFn: () => submissionsApi.run({ problemId: id, code, language }),
    onMutate: () => {
      setTab("console");
    },
    onSuccess: (data) => {
      setRunResult(data.result);
      setSubmitResult(null);
      setTab("console");
    },
    onError: (error) => {
      toast.error((error as Error).message || "Run failed");
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submissionsApi.create({ problemId: id, code, language }),
    onSuccess: (data) => {
      setSubmitResult(null);
      setRunResult(null);
      setTab("subs");
      void beginSubmissionPolling(data.submission_id);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Submit failed");
    },
  });

  if (problemLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading problem...
      </div>
    );
  }

  if (problemError || !problemEnvelope) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        {(problemErrorObj as Error)?.message || "Failed to load problem"}
      </div>
    );
  }

  const problem = problemEnvelope.problem;
  const testCases = problem.sampleTestCases;
  const currentStarterCode = getStarterCode(language);
  const activeResult = submitResult
    ? {
        status: submitResult.status,
        runtimeMs: submitResult.runtimeMs,
        memoryKb: submitResult.memoryKb,
        passedCount: submitResult.passedCount,
        totalCount: submitResult.totalCount,
      }
    : runResult;
  const isSubmissionProcessing = pendingSubmissionStatus ? isSubmissionPending(pendingSubmissionStatus) : false;
  const activeConsoleOutput = runResult
    ? `${runResult.stdout || ""}${runResult.stderr ? `\n${runResult.stderr}` : ""}`.trim()
    : submitResult
      ? `${submitResult.stdout || ""}${submitResult.stderr ? `\n${submitResult.stderr}` : ""}`.trim()
      : "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="border-b border-border bg-card">
        <div className="container flex h-12 items-center justify-between">
          <Link to="/student/problems" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
            <ChevronLeft className="h-4 w-4" /> Back to problems
          </Link>
          <div className="hidden text-xs text-muted-foreground md:block">
            Time limit: {problem.timeLimitSeconds}s {"\u2022"} Memory: {problem.memoryLimitMb} MB
          </div>
        </div>
      </div>

      <div className="flex-1 gap-0 p-2 lg:grid lg:grid-cols-12 lg:gap-2 lg:p-3">
        <Card className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6 shadow-card lg:col-span-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl font-bold">{problem.title}</h1>
            <DifficultyBadge d={problem.difficulty} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {problem.tags.map((tag) => (
              <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>

          <section className="mt-6 space-y-5 text-sm leading-relaxed">
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Description</h3>
              <p className="text-muted-foreground">{problem.statement}</p>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Input Format</h3>
              <p className="text-muted-foreground">{problem.inputFormat}</p>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Output Format</h3>
              <p className="text-muted-foreground">{problem.outputFormat}</p>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Examples</h3>
              <div className="space-y-2">
                {problem.examples.map((testCase, index) => (
                  <div key={`${testCase.input}-${index}`} className="rounded-md bg-secondary p-3 font-mono-code text-xs">
                    <div>
                      <span className="text-accent">Input:</span> {testCase.input}
                    </div>
                    <div>
                      <span className="text-accent">Output:</span> {testCase.output}
                    </div>
                    {testCase.explanation && <div className="mt-2 text-muted-foreground">{testCase.explanation}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Constraints</h3>
              <ul className="list-disc space-y-1 pl-5 font-mono-code text-xs text-muted-foreground">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </div>
          </section>
        </Card>

        <div className="mt-2 flex flex-col gap-2 lg:col-span-5 lg:mt-0">
          <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
            <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(event) => {
                    const nextLanguage = event.target.value as ExecutableLanguage;
                    const shouldSwapStarter = code.trim().length === 0 || code === currentStarterCode;

                    setLanguage(nextLanguage);
                    if (shouldSwapStarter) {
                      setCode(getStarterCode(nextLanguage));
                    }
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                >
                  {EXECUTABLE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {toLanguageLabel(lang)}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs">
                  <FileCode2 className="h-3 w-3 text-accent" />
                  <span className="font-mono-code">{getSolutionFilename(language)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setCode(currentStarterCode)}
                  aria-label="Reset"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Settings">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid min-h-[360px] flex-1 grid-cols-[3rem_1fr] bg-[hsl(220_50%_8%)] font-mono-code text-sm text-[hsl(40_30%_92%)] dark:bg-background">
              <div className="select-none border-r border-[hsl(220_30%_18%)] py-3 pr-2 text-right text-xs text-[hsl(220_15%_50%)]">
                {code.split("\n").map((_, index) => (
                  <div key={index} className="leading-6">
                    {index + 1}
                  </div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                className="w-full resize-none bg-transparent p-3 text-sm leading-6 outline-none"
              />
            </div>
            <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-3 py-1.5 font-mono-code text-[11px] text-muted-foreground">
              <span>Ln {code.split("\n").length}, Col 1</span>
              <span>UTF-8 {"\u2022"} LF {"\u2022"} {toLanguageLabel(language)}</span>
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-2 p-3 shadow-card">
            <div className="text-xs text-muted-foreground">
              {isSubmissionProcessing ? (
                <span className="flex items-center gap-1.5">
                  <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
                  Processing submission {pendingSubmissionStatus ? `(${formatStatus(pendingSubmissionStatus)})` : "..."}
                </span>
              ) : activeResult ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Last result: {formatStatus(activeResult.status)}
                </span>
              ) : (
                "Run code to see results"
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => runMutation.mutate()} disabled={runMutation.isPending || submitMutation.isPending || isSubmissionProcessing}>
                <Play className="mr-1 h-4 w-4" /> {runMutation.isPending ? "Running..." : "Run"}
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={runMutation.isPending || submitMutation.isPending || isSubmissionProcessing}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isSubmissionProcessing ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                {submitMutation.isPending || isSubmissionProcessing ? "Processing..." : "Submit"}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="mt-2 flex flex-col overflow-hidden shadow-card lg:col-span-3 lg:mt-0">
          <div className="flex border-b border-border bg-secondary/50">
            {(["tests", "console", "subs"] as const).map((section) => (
              <button
                key={section}
                onClick={() => setTab(section)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  tab === section ? "border-b-2 border-accent bg-background text-accent" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section === "tests" ? "Test Cases" : section === "console" ? "Console" : "Submissions"}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {tab === "tests" && (
              <>
                {activeResult && (
                  <div
                    className={cn(
                      "rounded-md border p-3",
                      activeResult.status === "ACCEPTED"
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={formatStatus(activeResult.status)} />
                      <span className="font-mono-code text-xs">
                        {activeResult.passedCount}/{activeResult.totalCount} passed
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 font-mono-code text-xs text-foreground">
                      <div className="rounded bg-background p-2">
                        <div className="text-muted-foreground">Runtime</div>
                        {activeResult.runtimeMs} ms
                      </div>
                      <div className="rounded bg-background p-2">
                        <div className="text-muted-foreground">Memory</div>
                        {(activeResult.memoryKb / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                )}
                {testCases.map((testCase, index) => (
                  <div key={`${testCase.input}-${index}`} className="rounded-md border border-border p-3">
                    <div className="mb-2 text-xs font-semibold">Case {index + 1}</div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Input</label>
                    <div className="mt-1 rounded border border-border bg-secondary px-2 py-1.5 font-mono-code text-xs">
                      {testCase.input}
                    </div>
                    <label className="mt-2 block text-[11px] uppercase tracking-wider text-muted-foreground">Expected</label>
                    <div className="mt-1 rounded bg-secondary px-2 py-1.5 font-mono-code text-xs">{testCase.output}</div>
                  </div>
                ))}
              </>
            )}
            {tab === "console" && (
              <pre className="whitespace-pre-wrap font-mono-code text-xs text-muted-foreground">
                {runMutation.isPending
                  ? "$ Running solution against test cases..."
                  : isSubmissionProcessing
                    ? `$ Submission ${pendingSubmissionId ?? ""} is ${pendingSubmissionStatus ? formatStatus(pendingSubmissionStatus) : "Processing"}...`
                    : activeConsoleOutput || (activeResult ? `Status: ${formatStatus(activeResult.status)}` : "// stdout/stderr will appear here")}
              </pre>
            )}
            {tab === "subs" && (
              <div className="space-y-2">
                {isSubmissionProcessing && (
                  <div className="flex items-center justify-between rounded-md border border-accent/30 bg-accent/10 p-2 text-xs">
                    <StatusBadge status={formatStatus(pendingSubmissionStatus ?? "QUEUED")} />
                    <span className="font-mono-code text-muted-foreground">processing</span>
                    <span className="flex items-center gap-1 text-accent">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      live
                    </span>
                  </div>
                )}
                {submissions.length === 0 && !isSubmissionProcessing && <div className="text-xs text-muted-foreground">No submissions yet.</div>}
                {submissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <StatusBadge status={formatStatus(submission.status)} />
                    <span className="font-mono-code text-muted-foreground">{submission.runtimeMs} ms</span>
                    <span className="text-muted-foreground">{formatRelativeTime(submission.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
