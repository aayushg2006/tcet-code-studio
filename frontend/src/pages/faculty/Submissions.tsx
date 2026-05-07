import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Badges";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submissionsApi } from "@/api/services";
import { toLanguageLabel, toStatusLabel } from "@/api/mappers";
import type { SubmissionStatus, SupportedLanguage } from "@/api/types";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

export default function FacultySubmissions() {
  const [problemFilter, setProblemFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "All">("All");
  const [languageFilter, setLanguageFilter] = useState<SupportedLanguage | "All">("All");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["faculty-submissions", problemFilter, statusFilter, languageFilter],
    queryFn: () =>
      submissionsApi.list(
        {
          pageSize: 100,
          problemId: problemFilter === "All" ? undefined : problemFilter,
          status: statusFilter === "All" ? undefined : statusFilter,
          language: languageFilter === "All" ? undefined : languageFilter,
        },
        "/faculty/submissions",
      ),
  });

  const { data: selectedSubmissionData, isLoading: selectedLoading } = useQuery({
    queryKey: ["faculty-submission-detail", selectedSubmissionId],
    queryFn: () => submissionsApi.getById(selectedSubmissionId || "", "/faculty/submissions"),
    enabled: Boolean(selectedSubmissionId),
  });

  const submissions = data?.items ?? [];
  const problems = useMemo(
    () => Array.from(new Set(submissions.map((submission) => submission.problemId))),
    [submissions],
  );
  const statuses = useMemo(
    () => Array.from(new Set(submissions.map((submission) => submission.status))),
    [submissions],
  );
  const languages = useMemo(
    () => Array.from(new Set(submissions.map((submission) => submission.language))),
    [submissions],
  );

  return (
    <AppLayout>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Code Submissions</h1>
          <p className="mt-1 text-muted-foreground">Inspect every submission across all problems.</p>
        </div>

        <Card className="flex flex-wrap gap-3 p-4 shadow-card">
          <select value={problemFilter} onChange={(event) => setProblemFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option>
            {problems.map((problemId) => (
              <option key={problemId}>{problemId}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SubmissionStatus | "All")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {toStatusLabel(status)}
              </option>
            ))}
          </select>
          <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value as SupportedLanguage | "All")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {toLanguageLabel(language)}
              </option>
            ))}
          </select>
        </Card>

        <Card className="overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Lang</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Runtime</th>
                  <th className="px-4 py-3 text-right font-semibold">Memory</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 text-right font-semibold">Code</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Loading submissions...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-destructive">
                      {(error as Error)?.message || "Failed to load submissions"}
                    </td>
                  </tr>
                )}
                {!isLoading && !isError &&
                  submissions.map((submission) => (
                    <tr key={submission.id} className="border-t border-border hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <div className="font-medium">{submission.userEmail}</div>
                        <div className="font-mono-code text-xs text-muted-foreground">{submission.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">{submission.problemTitle}</td>
                      <td className="px-4 py-3 font-mono-code text-xs">{toLanguageLabel(submission.language)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={toStatusLabel(submission.status)} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono-code text-xs">{submission.runtimeMs} ms</td>
                      <td className="px-4 py-3 text-right font-mono-code text-xs">{(submission.memoryKb / 1024).toFixed(1)} MB</td>
                      <td className="px-4 py-3 font-mono-code text-xs text-muted-foreground">{formatDate(submission.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedSubmissionId(submission.id)}>
                          <Eye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                {!isLoading && !isError && submissions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={Boolean(selectedSubmissionId)} onOpenChange={(open) => !open && setSelectedSubmissionId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedSubmissionData?.submission.userEmail} — {selectedSubmissionData?.submission.problemTitle}
            </DialogTitle>
          </DialogHeader>
          {selectedLoading && <div className="text-sm text-muted-foreground">Loading code...</div>}
          {!selectedLoading && selectedSubmissionData?.submission && (
            <>
              <div className="flex items-center gap-3 text-xs">
                <StatusBadge status={toStatusLabel(selectedSubmissionData.submission.status)} />
                <span className="font-mono-code text-muted-foreground">{toLanguageLabel(selectedSubmissionData.submission.language)}</span>
                <span className="font-mono-code text-muted-foreground">
                  {selectedSubmissionData.submission.runtimeMs} ms · {(selectedSubmissionData.submission.memoryKb / 1024).toFixed(1)} MB
                </span>
              </div>
              <pre className="max-h-96 overflow-auto rounded-lg bg-[hsl(220_50%_8%)] p-4 font-mono-code text-xs text-[hsl(40_30%_92%)]">
                {selectedSubmissionData.submission.code || "// No code payload returned"}
              </pre>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
