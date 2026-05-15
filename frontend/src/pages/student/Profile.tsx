import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";

import { AppLayout } from "@/components/AppLayout";
import { submissionsApi, userApi } from "@/api/services";
import { SubmissionActivityHeatmap } from "@/components/SubmissionActivityHeatmap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/Badges";
import { toLanguageLabel, toStatusLabel } from "@/api/mappers";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#eab308",
  Hard: "#ef4444",
};

function initialsFromName(name: string | null, email: string): string {
  if (!name) {
    return email.slice(0, 2).toUpperCase();
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statCard(label: string, value: string | number) {
  return (
    <Card className="border border-border bg-background p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold leading-none">{value}</p>
    </Card>
  );
}

function formatWhen(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--background))",
  borderColor: "hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

export default function StudentProfile() {
  const { email: emailParam } = useParams();
  const targetEmail = emailParam ? decodeURIComponent(emailParam) : null;
  const isFacultyView = Boolean(targetEmail);
  const pathname = isFacultyView ? `/faculty/students/${encodeURIComponent(targetEmail!)}` : "/student/profile";
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ["student-profile", targetEmail ?? "self"],
    queryFn: () => (isFacultyView && targetEmail ? userApi.getByEmail(targetEmail, pathname) : userApi.me(pathname)),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["student-profile-analytics", targetEmail ?? "self"],
    queryFn: () =>
      isFacultyView && targetEmail
        ? userApi.getAnalyticsByEmail(targetEmail, pathname)
        : userApi.getAnalytics(pathname),
    enabled: Boolean(userData?.user),
  });

  const { data: selectedSubmissionData, isLoading: selectedSubmissionLoading } = useQuery({
    queryKey: ["profile-submission-detail", selectedSubmissionId, pathname],
    queryFn: () => submissionsApi.getById(selectedSubmissionId || "", pathname),
    enabled: Boolean(selectedSubmissionId),
  });

  const difficultyData = useMemo(
    () =>
      (analyticsData?.analytics.difficultyBreakdown ?? []).map((entry) => ({
        name: entry.difficulty,
        value: entry.solvedCount,
        color: DIFFICULTY_COLORS[entry.difficulty],
      })),
    [analyticsData?.analytics.difficultyBreakdown],
  );

  const languageData = useMemo(
    () =>
      (analyticsData?.analytics.languageBreakdown ?? []).map((entry) => ({
        name: toLanguageLabel(entry.language),
        count: entry.submissionCount,
      })),
    [analyticsData?.analytics.languageBreakdown],
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 text-muted-foreground md:p-8">Loading profile...</div>
      </AppLayout>
    );
  }

  if (isError || !userData?.user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 text-destructive md:p-8">{(error as Error)?.message || "Failed to load profile"}</div>
      </AppLayout>
    );
  }

  const profile = userData.user;
  const analytics = analyticsData?.analytics;
  const initials = initialsFromName(profile.name, profile.email);

  return (
    <AppLayout>
      <div className="container mx-auto space-y-6 p-6 md:p-8">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold">
            {isFacultyView ? "Student Profile Dashboard" : "Academic Profile Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Student identity, endorsement profile, and performance snapshot.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <Card className="relative border border-border bg-background p-6">
              <Badge
                className={`absolute right-6 top-6 border-0 ${
                  profile.isProfileComplete
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-amber-500 text-white hover:bg-amber-500"
                }`}
              >
                {profile.isProfileComplete ? "Profile Complete" : "Profile Incomplete"}
              </Badge>

              <div className="flex items-center gap-4 pt-8">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarFallback className="bg-slate-100 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">{profile.name ?? "Student"}</p>
                  <p className="truncate text-sm text-muted-foreground">{profile.uid ?? profile.email}</p>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-medium">{profile.rollNumber ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{profile.department ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-medium">{profile.semester ?? "Not set"}</span>
                </div>
                {profile.role === "FACULTY" && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Designation</span>
                    <span className="font-medium">{profile.designation ?? "Not set"}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">GitHub</span>
                  <a
                    href={profile.githubUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[62%] truncate font-medium text-primary hover:underline"
                  >
                    {profile.githubUrl ?? "Not set"}
                  </a>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">LinkedIn</span>
                  <a
                    href={profile.linkedInUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[62%] truncate font-medium text-primary hover:underline"
                  >
                    {profile.linkedInUrl ?? "Not set"}
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6 md:col-span-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {statCard("Global Rank", profile.rank ? `#${profile.rank}` : "N/A")}
              {statCard("Total Solved", profile.problemsSolved)}
              {statCard("Accepted", profile.acceptedSubmissionCount)}
              {statCard("Accuracy", `${profile.accuracy}%`)}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border border-border bg-background p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Problem Difficulty</h2>
                <div className="mt-4 flex items-center justify-center">
                  <PieChart width={260} height={220}>
                    <Pie data={difficultyData} cx="50%" cy="50%" outerRadius={78} innerRadius={45} dataKey="value" strokeWidth={1}>
                      {difficultyData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </div>
              </Card>

              <Card className="border border-border bg-background p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Language Proficiency</h2>
                <div className="mt-4 overflow-x-auto">
                  <BarChart width={320} height={220} data={languageData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </div>
              </Card>
            </div>

            <Card className="border border-border bg-background">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Submission Activity</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center overflow-x-auto pb-6">
                <SubmissionActivityHeatmap activity={analytics?.submissionHeatmap ?? []} />
              </CardContent>
            </Card>

            <Card className="border border-border bg-background p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Accepted</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <div className="grid grid-cols-12 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <div className="col-span-5">Problem</div>
                  <div className="col-span-2">Language</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">When</div>
                </div>
                {(analytics?.recentAcceptedSubmissions ?? []).map((entry) => (
                  <div key={entry.submissionId} className="grid grid-cols-12 border-t border-border px-4 py-3 text-sm">
                    <div className="col-span-5">
                      <p className="font-medium">{entry.problemTitle}</p>
                      {entry.contestTitle && <p className="text-xs text-muted-foreground">{entry.contestTitle}</p>}
                    </div>
                    <div className="col-span-2 self-center">{toLanguageLabel(entry.language)}</div>
                    <div className="col-span-2 self-center">
                      <StatusBadge status={toStatusLabel(entry.status)} />
                    </div>
                    <div className="col-span-3 self-center text-xs text-muted-foreground">{formatWhen(entry.createdAt)}</div>
                  </div>
                ))}
                {(analytics?.recentAcceptedSubmissions.length ?? 0) === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">No accepted submissions yet.</div>
                )}
              </div>
            </Card>

            <Card className="border border-border bg-background p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Submission History</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <div className="grid grid-cols-12 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <div className="col-span-4">Problem</div>
                  <div className="col-span-2">Language</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">When</div>
                  <div className="col-span-2 text-right">Code</div>
                </div>
                {(analytics?.submissionHistory ?? []).map((entry) => (
                  <div key={entry.submissionId} className="grid grid-cols-12 border-t border-border px-4 py-3 text-sm">
                    <div className="col-span-4">
                      <p className="font-medium">{entry.problemTitle}</p>
                      {entry.contestTitle && <p className="text-xs text-muted-foreground">{entry.contestTitle}</p>}
                    </div>
                    <div className="col-span-2 self-center">{toLanguageLabel(entry.language)}</div>
                    <div className="col-span-2 self-center">
                      <StatusBadge status={toStatusLabel(entry.status)} />
                    </div>
                    <div className="col-span-2 self-center text-xs text-muted-foreground">{formatWhen(entry.createdAt)}</div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-accent hover:underline"
                        onClick={() => setSelectedSubmissionId(entry.submissionId)}
                      >
                        View Code
                      </button>
                    </div>
                  </div>
                ))}
                {(analytics?.submissionHistory.length ?? 0) === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">No submission history yet.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedSubmissionId)} onOpenChange={(open) => !open && setSelectedSubmissionId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSubmissionData?.submission.problemTitle ?? "Submission Code"}</DialogTitle>
          </DialogHeader>
          {selectedSubmissionLoading && <div className="text-sm text-muted-foreground">Loading code…</div>}
          {!selectedSubmissionLoading && selectedSubmissionData?.submission && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{toLanguageLabel(selectedSubmissionData.submission.language)}</span>
                <StatusBadge status={toStatusLabel(selectedSubmissionData.submission.status)} />
                <span>
                  {selectedSubmissionData.submission.runtimeMs} ms •{" "}
                  {(selectedSubmissionData.submission.memoryKb / 1024).toFixed(1)} MB
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
